import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useExperimentStore } from '../../stores/useExperimentStore'
import { useDecisionStore } from '../../stores/useDecisionStore'
import { PageLayout } from '../../components/layout/PageLayout'
import { Badge } from '../../components/shared/Badge'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import type { Experiment, Variant, RuleGroupObject } from '../../types'

const EMPTY: Experiment = {
  id: '', name: '', flow_id: 0, flow_name: '', status: 'draft',
  start_time: new Date().toISOString().slice(0, 16),
  end_time: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  created_at: new Date().toISOString(),
  variants: [],
}

function ConditionList({ rg }: { rg: RuleGroupObject }) {
  return (
    <div className="mt-2 space-y-1">
      <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wide">
        Logic: {rg.logic} · {rg.conditions.length} conditions
      </p>
      {rg.conditions.map((c) => (
        <div key={c.id} className="flex items-center gap-1.5 text-xs font-mono text-ink-600 bg-surface-100 px-2 py-1 rounded">
          <span className="text-ink-500">{c.fact_name}</span>
          <span className="text-primary-600 font-semibold">{c.operator}</span>
          <span className="text-ink-800">{Array.isArray(c.value) ? c.value.join(', ') : String(c.value)}</span>
          {!c.enabled && <span className="text-red-400 ml-auto">(disabled)</span>}
        </div>
      ))}
      {rg.actions.map((a, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs font-mono text-green-700 bg-green-50 px-2 py-1 rounded">
          <span className="font-semibold">→</span>
          <span>{a.type}: {a.value}</span>
        </div>
      ))}
    </div>
  )
}

function MetricsDashboard({ experimentId }: { experimentId: string }) {
  const { metrics } = useExperimentStore()
  const data = metrics[experimentId]

  if (!data || data.length === 0) {
    return <p className="text-ink-400 text-sm text-center py-6">Chưa có dữ liệu metrics</p>
  }

  const fmt = (n: number) => n.toLocaleString('vi-VN')
  const pct = (n: number) => (n * 100).toFixed(1) + '%'
  const currency = (n: number) =>
    n >= 1e9 ? (n / 1e9).toFixed(2) + ' tỷ' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' triệu' : fmt(n)

  const best = (key: keyof typeof data[0]) =>
    Math.max(...data.map((d) => Number(d[key])))

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Metric</th>
            {data.map((d) => <th key={d.variant_id} className="text-center">{d.variant_name}</th>)}
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'Impressions', key: 'impressions' as const, fmt: fmt },
            { label: 'Clicks', key: 'clicks' as const, fmt: fmt },
            { label: 'Conversions', key: 'conversions' as const, fmt: fmt },
            { label: 'CTR', key: 'ctr' as const, fmt: pct },
            { label: 'CVR', key: 'cvr' as const, fmt: pct },
            { label: 'Revenue', key: 'revenue' as const, fmt: currency },
          ].map(({ label, key, fmt: f }) => {
            const bestVal = best(key)
            return (
              <tr key={key}>
                <td className="font-medium text-ink-700">{label}</td>
                {data.map((d) => {
                  const val = Number(d[key])
                  const isBest = val === bestVal && val > 0
                  return (
                    <td key={d.variant_id} className={`text-center ${isBest ? 'text-green-700 font-semibold' : 'text-ink-600'}`}>
                      {isBest && <span className="text-green-400 mr-1 text-xs">▲</span>}
                      {f(val)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ExperimentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getById, save, add, remove, transition } = useExperimentStore()
  const { flows, getById: getFlowById } = useDecisionStore()
  const isNew = id === 'new'

  const [form, setForm] = useState<Experiment>(EMPTY)
  const [editMode, setEditMode] = useState(isNew || !!(location.state as { editMode?: boolean })?.editMode)
  const [toast, setToast] = useState('')
  const [toastError, setToastError] = useState('')
  const [activeTab, setActiveTab] = useState<'setup' | 'metrics'>('setup')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!isNew) {
      const found = getById(id!)
      if (found) setForm(JSON.parse(JSON.stringify(found)))
      else navigate('/experiments')
    }
  }, [id])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const showError = (msg: string) => { setToastError(msg); setTimeout(() => setToastError(''), 4000) }
  const patch = <K extends keyof Experiment>(k: K, v: Experiment[K]) => setForm((f) => ({ ...f, [k]: v }))
  const isDraft = form.status === 'draft' || isNew

  // The flow currently selected in the form
  const selectedFlow = form.flow_id ? getFlowById(form.flow_id) : undefined

  const handleFlowChange = (flowId: number) => {
    const flow = getFlowById(flowId)
    if (!flow) { setForm((f) => ({ ...f, flow_id: 0, flow_name: '', variants: [] })); return }
    setForm((f) => ({ ...f, flow_id: flow.id, flow_name: flow.name, variants: [] }))
  }

  // Toggle a rule group as a variant
  const toggleRuleGroup = (rg: RuleGroupObject) => {
    const already = form.variants.find((v) => v.rule_group_id === rg.id)
    if (already) {
      patch('variants', form.variants.filter((v) => v.rule_group_id !== rg.id))
    } else {
      const newVariant: Variant = {
        id: `var-${Date.now()}-${rg.id}`,
        experiment_id: form.id,
        name: rg.name,
        rule_group_id: rg.id,
        rule_group_name: rg.name,
        rule_group_snapshot: rg,
      }
      patch('variants', [...form.variants, newVariant])
    }
  }

  const updateVariantName = (rgId: string, name: string) => {
    patch('variants', form.variants.map((v) => v.rule_group_id === rgId ? { ...v, name } : v))
  }

  const handleSave = () => {
    if (!form.name.trim()) { showError('Experiment name là bắt buộc'); return }
    if (!form.start_time || !form.end_time) { showError('Thời gian bắt đầu / kết thúc là bắt buộc'); return }
    if (isDraft && !form.flow_id) { showError('Phải chọn một Decision Flow'); return }
    if (isDraft && form.variants.length < 2) { showError('Phải chọn ít nhất 2 Rule Groups để so sánh'); return }

    if (isNew) {
      const newId = `exp-${Date.now()}`
      add({ ...form, id: newId, created_at: new Date().toISOString() })
      navigate(`/experiments/${newId}`)
    } else {
      save(form)
      setEditMode(false)
    }
    showToast('Đã lưu')
  }

  const handleTransition = (action: 'start' | 'pause' | 'resume' | 'complete', successMsg: string) => {
    const err = transition(id!, action)
    if (err) showError(err)
    else {
      showToast(successMsg)
      const updated = getById(id!)
      if (updated) setForm(JSON.parse(JSON.stringify(updated)))
    }
  }

  return (
    <PageLayout
      title={isNew ? 'Tạo Experiment mới' : form.name}
      subtitle={isNew ? 'A/B Testing' : `${form.flow_name} · ${form.variants.length} rule groups`}
      actions={
        <div className="flex items-center gap-2">
          {!isNew && <Badge status={form.status} />}
          {form.status === 'draft' && !isNew && (
            <button className="btn text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 text-xs"
              onClick={() => handleTransition('start', 'Experiment đã start')}>Start</button>
          )}
          {form.status === 'running' && (
            <>
              <button className="btn text-orange-500 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs"
                onClick={() => handleTransition('pause', 'Experiment đã pause')}>Pause</button>
              <button className="btn text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 text-xs"
                onClick={() => handleTransition('complete', 'Experiment đã complete')}>Stop</button>
            </>
          )}
          {form.status === 'paused' && (
            <>
              <button className="btn text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs"
                onClick={() => handleTransition('resume', 'Experiment đã resume')}>Resume</button>
              <button className="btn text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 text-xs"
                onClick={() => handleTransition('complete', 'Experiment đã complete')}>Stop</button>
            </>
          )}
          {!isNew && (
            <button className="btn text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 text-xs" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
          )}
          {!editMode ? (
            <button className="btn-primary" onClick={() => setEditMode(true)}>Edit</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => { if (isNew) navigate(-1); else { setEditMode(false); const f = getById(id!); if (f) setForm(JSON.parse(JSON.stringify(f))) } }}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save</button>
            </>
          )}
        </div>
      }
    >
      {toast && <div className="fixed top-4 right-4 z-50 bg-ink-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{toast}</div>}
      {toastError && <div className="fixed top-16 right-4 z-50 bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg max-w-xs">{toastError}</div>}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Xóa Experiment"
        message={`Bạn có chắc muốn xóa experiment "${form.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        danger
        onConfirm={() => { remove(id!); navigate('/experiments') }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Tabs */}
      {!isNew && (
        <div className="tab-bar">
          <button className={activeTab === 'setup' ? 'tab-item-active' : 'tab-item'} onClick={() => setActiveTab('setup')}>Setup</button>
          <button className={activeTab === 'metrics' ? 'tab-item-active' : 'tab-item'} onClick={() => setActiveTab('metrics')}>Metrics Dashboard</button>
        </div>
      )}

      {(isNew || activeTab === 'setup') && (
        <>
          {/* Basic Information */}
          <div className="card">
            <div className="card-header"><h2>Basic Information</h2></div>
            <div className="card-body grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">Experiment Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => patch('name', e.target.value)} disabled={!editMode} placeholder="VD: Cathay — Which segment converts better?" />
              </div>
              <div>
                <label className="form-label">Start Time *</label>
                <input className="form-input" type="datetime-local" value={form.start_time.slice(0, 16)} onChange={(e) => patch('start_time', e.target.value)} disabled={!editMode} />
              </div>
              <div>
                <label className="form-label">End Time *</label>
                <input className="form-input" type="datetime-local" value={form.end_time.slice(0, 16)} onChange={(e) => patch('end_time', e.target.value)} disabled={!editMode} />
              </div>
            </div>
          </div>

          {/* Decision Flow */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Decision Flow</h2>
                <p className="text-xs text-ink-400 mt-0.5">Chọn flow cần so sánh — experiment sẽ quan sát user thuộc các Rule Groups trong flow này</p>
              </div>
            </div>
            <div className="card-body">
              {(editMode && isDraft) ? (
                <select
                  className="form-select"
                  value={form.flow_id || ''}
                  onChange={(e) => handleFlowChange(Number(e.target.value))}
                >
                  <option value="">— Chọn Decision Flow —</option>
                  {flows.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}{f.bank_code ? ` (${f.bank_code})` : ' (General)'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-ink-800">{form.flow_name || '—'}</span>
                  {selectedFlow?.bank_code
                    ? <span className="text-[10px] font-mono font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">{selectedFlow.bank_code}</span>
                    : form.flow_id ? <span className="text-xs text-ink-400 italic">General</span> : null
                  }
                  {!isDraft && <span className="text-[10px] text-ink-400 italic ml-1">(locked after start)</span>}
                </div>
              )}
            </div>
          </div>

          {/* Rule Group Selector (draft edit mode only) */}
          {(editMode && isDraft && selectedFlow) && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h2>Chọn Rule Groups để so sánh</h2>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Chọn ít nhất 2 Rule Groups — mỗi group sẽ trở thành một Variant.
                    <span className={`ml-2 font-medium ${form.variants.length >= 2 ? 'text-green-600' : 'text-red-500'}`}>
                      Đã chọn: {form.variants.length}
                    </span>
                  </p>
                </div>
              </div>
              <div className="card-body space-y-3">
                {selectedFlow.rule_groups.length === 0 && (
                  <p className="text-sm text-ink-400 text-center py-4">Flow này chưa có Rule Group nào</p>
                )}
                {selectedFlow.rule_groups.map((rg) => {
                  const variant = form.variants.find((v) => v.rule_group_id === rg.id)
                  const checked = !!variant
                  return (
                    <div
                      key={rg.id}
                      className={`rounded-xl border-2 transition-colors ${checked ? 'border-primary-400 bg-primary-50' : 'border-surface-200 bg-surface-50'}`}
                    >
                      <label className="flex items-start gap-3 p-4 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-primary-600"
                          checked={checked}
                          onChange={() => toggleRuleGroup(rg)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-ink-400">#{rg.order}</span>
                            <span className="font-medium text-ink-800 text-sm">{rg.name}</span>
                            <span className="text-[10px] text-ink-400 bg-surface-200 px-1.5 py-0.5 rounded font-mono">{rg.logic}</span>
                          </div>
                          <ConditionList rg={rg} />
                        </div>
                      </label>
                      {checked && (
                        <div className="px-4 pb-4">
                          <label className="form-label text-xs">Variant Label (editable)</label>
                          <input
                            className="form-input text-sm"
                            value={variant!.name}
                            onChange={(e) => updateVariantName(rg.id, e.target.value)}
                            placeholder="Tên hiển thị cho variant này"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Variant view: shown when not editing, or when editing a non-draft (rule groups locked) */}
          {(!editMode || !isDraft) && form.variants.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2>Variants</h2>
                <span className="text-xs text-ink-400">{form.variants.length} rule groups đang được so sánh</span>
              </div>
              <div className="card-body space-y-4">
                {form.variants.map((v, i) => (
                  <div key={v.id} className="p-4 bg-surface-50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-ink-400 bg-surface-200 px-1.5 py-0.5 rounded">Variant {String.fromCharCode(65 + i)}</span>
                      <span className="font-semibold text-ink-800 text-sm">{v.name}</span>
                    </div>
                    <p className="text-xs text-ink-500 font-mono">Rule Group: {v.rule_group_name}</p>
                    {form.status !== 'draft' && (
                      <>
                        <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wide mt-2">Snapshot (immutable)</p>
                        <ConditionList rg={v.rule_group_snapshot} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!isNew && activeTab === 'metrics' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Metrics Dashboard</h2>
              <p className="text-xs text-ink-400">So sánh side-by-side giữa các Rule Groups. Giá trị tốt nhất được highlight.</p>
            </div>
          </div>
          <div className="card-body">
            <MetricsDashboard experimentId={id!} />
          </div>
        </div>
      )}
    </PageLayout>
  )
}
