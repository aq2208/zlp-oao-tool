import { create } from 'zustand'
import type { Experiment, ExperimentMetrics } from '../types'
import { mockExperiments, mockMetrics } from '../mocks/experiments'

interface ExperimentStore {
  experiments: Experiment[]
  metrics: Record<string, ExperimentMetrics[]>
  getById: (id: string) => Experiment | undefined
  save: (exp: Experiment) => void
  add: (exp: Experiment) => void
  remove: (id: string) => void
  clone: (id: string) => void
  /** Returns an error string if the transition is invalid, undefined on success */
  transition: (id: string, action: 'start' | 'pause' | 'resume' | 'stop') => string | undefined
}

export const useExperimentStore = create<ExperimentStore>((set, get) => ({
  experiments: mockExperiments,
  metrics: mockMetrics,

  getById: (id) => get().experiments.find((e) => e.id === id),

  save: (updated) =>
    set((state) => ({
      experiments: state.experiments.map((e) => (e.id === updated.id ? updated : e)),
    })),

  add: (exp) => set((state) => ({ experiments: [...state.experiments, exp] })),

  remove: (id) => set((state) => ({ experiments: state.experiments.filter((e) => e.id !== id) })),

  clone: (id) => {
    const original = get().getById(id)
    if (!original) return
    const cloned: Experiment = {
      ...original,
      id: `exp-${Date.now()}`,
      name: `${original.name} (Clone)`,
      status: 'draft',
      created_at: new Date().toISOString(),
      variants: original.variants.map((v) => ({ ...v, id: `var-${Date.now()}-${v.rule_group_id}`, experiment_id: `exp-${Date.now()}` })),
    }
    set((state) => ({ experiments: [...state.experiments, cloned] }))
  },

  transition: (id, action) => {
    const STATUS_MAP: Record<string, Record<string, string>> = {
      start:    { draft: 'running' },
      pause:    { running: 'paused' },
      resume:   { paused: 'running' },
      stop:     { running: 'draft', paused: 'draft' },
    }

    const exp = get().getById(id)
    if (!exp) return 'Experiment không tồn tại'

    if (action === 'start') {
      if (!exp.name) return 'Experiment: Name bắt buộc'
      if (!exp.flow_id) return 'Experiment: Phải chọn một Decision Flow'
      if (!exp.start_time || !exp.end_time) return 'Experiment: Thời gian bắt đầu / kết thúc bắt buộc'
      if (exp.variants.length < 2) return 'Experiment: Phải chọn ít nhất 2 Rule Groups để so sánh'
    }

    const nextStatus = STATUS_MAP[action]?.[exp.status]
    if (!nextStatus) return `Không thể chuyển từ "${exp.status}" với action "${action}"`

    // When starting: freeze rule group snapshots into variants
    const updatedVariants = action === 'start'
      ? exp.variants.map((v) => ({ ...v, rule_group_snapshot: v.rule_group_snapshot }))
      : exp.variants

    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === id
          ? { ...e, status: nextStatus as Experiment['status'], variants: updatedVariants }
          : e
      ),
    }))
    return undefined
  },
}))
