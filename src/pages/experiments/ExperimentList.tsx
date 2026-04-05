import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExperimentStore } from '../../stores/useExperimentStore'
import { useDecisionStore } from '../../stores/useDecisionStore'
import { PageLayout } from '../../components/layout/PageLayout'
import { Badge } from '../../components/shared/Badge'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import type { ExperimentStatus } from '../../types'

export function ExperimentList() {
  const { experiments, transition, clone, remove } = useExperimentStore()
  const { flows } = useDecisionStore()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState<ExperimentStatus | ''>('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [toastError, setToastError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; status: string } | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const showError = (msg: string) => { setToastError(msg); setTimeout(() => setToastError(''), 4000) }

  const handleTransition = (id: string, action: 'start' | 'pause' | 'resume' | 'complete', successMsg: string) => {
    const err = transition(id, action)
    if (err) showError(err)
    else showToast(successMsg)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    setDeleteTarget(null)
    showToast('Đã xóa experiment')
  }

  const filtered = experiments.filter((e) => {
    const matchStatus = !filterStatus || e.status === filterStatus
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.flow_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <PageLayout
      title="A/B Testing"
      subtitle="So sánh hiệu quả giữa các Rule Groups trong cùng một Decision Flow"
      actions={
        <button className="btn-primary" onClick={() => navigate('/experiments/new')}>+ Add New Experiment</button>
      }
    >
      {toast && <div className="fixed top-4 right-4 z-50 bg-ink-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{toast}</div>}
      {toastError && <div className="fixed top-16 right-4 z-50 bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg max-w-xs">{toastError}</div>}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa Experiment"
        message={
          deleteTarget?.status !== 'draft'
            ? `Experiment "${deleteTarget?.name}" đang ở trạng thái ${deleteTarget?.status}. Bạn có chắc muốn xóa không?`
            : `Bạn có chắc muốn xóa experiment "${deleteTarget?.name}"?`
        }
        confirmLabel="Xóa"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="form-input w-64"
          placeholder="Tìm theo tên hoặc flow..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-select w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ExperimentStatus | '')}>
          <option value="">Tất cả Status</option>
          <option value="draft">Draft</option>
          <option value="running">Running</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        <span className="text-xs text-ink-400 ml-auto">{filtered.length} experiments</span>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Decision Flow</th>
                <th>Status</th>
                <th>Variants</th>
                <th>Timeline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-ink-400 py-8">Không có kết quả</td></tr>
              )}
              {filtered.map((e) => {
                const flow = flows.find((f) => f.id === e.flow_id)
                return (
                  <tr key={e.id}>
                    <td>
                      <p className="font-medium text-ink-900">{e.name}</p>
                      <p className="text-xs text-ink-400 font-mono">{e.id}</p>
                    </td>
                    <td>
                      <p className="font-mono text-xs font-medium text-ink-800">{e.flow_name}</p>
                      {flow?.bank_code
                        ? <span className="text-[10px] font-mono font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">{flow.bank_code}</span>
                        : <span className="text-[10px] text-ink-300 italic">General</span>
                      }
                    </td>
                    <td><Badge status={e.status} /></td>
                    <td className="text-ink-500 text-xs">{e.variants.length} rule groups</td>
                    <td className="text-ink-400 text-xs">
                      <p>{new Date(e.start_time).toLocaleDateString('vi-VN')}</p>
                      <p>→ {new Date(e.end_time).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        <button className="btn-ghost text-xs" onClick={() => navigate(`/experiments/${e.id}`)}>View</button>
                        {e.status === 'draft' && (
                          <button className="btn-ghost text-xs text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/experiments/${e.id}`, { state: { editMode: true } })}>Edit</button>
                        )}
                        <button className="btn-ghost text-xs text-purple-600 hover:bg-purple-50" onClick={() => { clone(e.id); showToast(`Đã clone "${e.name}"`) }}>Clone</button>
                        {e.status === 'draft' && (
                          <button className="btn-ghost text-xs text-green-600 hover:bg-green-50" onClick={() => handleTransition(e.id, 'start', 'Experiment đã start')}>Start</button>
                        )}
                        {e.status === 'running' && (
                          <button className="btn-ghost text-xs text-orange-500 hover:bg-orange-50" onClick={() => handleTransition(e.id, 'pause', 'Experiment đã pause')}>Pause</button>
                        )}
                        {e.status === 'paused' && (
                          <button className="btn-ghost text-xs text-blue-600 hover:bg-blue-50" onClick={() => handleTransition(e.id, 'resume', 'Experiment đã resume')}>Resume</button>
                        )}
                        {(e.status === 'running' || e.status === 'paused') && (
                          <button className="btn-ghost text-xs text-red-500 hover:bg-red-50" onClick={() => handleTransition(e.id, 'complete', 'Experiment đã complete')}>Stop</button>
                        )}
                        <button className="btn-ghost text-xs text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget({ id: e.id, name: e.name, status: e.status })}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  )
}
