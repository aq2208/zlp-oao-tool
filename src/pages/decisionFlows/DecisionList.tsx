import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDecisionStore } from '../../stores/useDecisionStore'
import { PageLayout } from '../../components/layout/PageLayout'
import { Badge } from '../../components/shared/Badge'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'

export function DecisionList() {
  const { flows, remove, clone } = useDecisionStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterBankCode, setFilterBankCode] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const bankCodes = Array.from(new Set(flows.map((f) => f.bank_code).filter(Boolean))) as string[]

  const filtered = flows.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      String(f.id).includes(search) ||
      (f.bank_code ?? '').toLowerCase().includes(search.toLowerCase())
    const matchBank = !filterBankCode
      ? true
      : filterBankCode === '__general__'
        ? !f.bank_code
        : f.bank_code === filterBankCode
    return matchSearch && matchBank
  })

  return (
    <PageLayout
      title="Decision Tool"
      subtitle="Quản lý decision flows — quyết định user nào thấy partner nào"
      actions={
        <div className="flex gap-2">
          <button className="btn-secondary text-xs" onClick={() => showToast('Đã refresh danh sách')}>Refresh</button>
          <button className="btn-primary" onClick={() => navigate('/decision-flows/new')}>+ Add New</button>
        </div>
      }
    >
      {toast && <div className="fixed top-4 right-4 z-50 bg-ink-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{toast}</div>}

      <div className="flex flex-wrap gap-3 items-center">
        <input className="form-input w-64" placeholder="Tìm theo ID, Name, Bank Code..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select w-44" value={filterBankCode} onChange={(e) => setFilterBankCode(e.target.value)}>
          <option value="">Tất cả Bank</option>
          <option value="__general__">General (không gắn bank)</option>
          {bankCodes.map((bc) => <option key={bc} value={bc}>{bc}</option>)}
        </select>
        <span className="text-xs text-ink-400 ml-auto">{filtered.length} flows</span>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Name</th>
                <th>Bank Code</th>
                <th>Description</th>
                <th>Status</th>
                <th>Rules</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-ink-400 py-8">Không có kết quả</td></tr>
              )}
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td className="font-mono text-xs text-ink-400">#{f.id}</td>
                  <td>
                    <p className="font-medium text-ink-900 font-mono text-xs">{f.name}</p>
                    <p className="text-xs text-ink-400">{f.flow_type} · v{f.version}</p>
                  </td>
                  <td>
                    {f.bank_code
                      ? <span className="font-mono text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{f.bank_code}</span>
                      : <span className="text-xs text-ink-300 italic">General</span>
                    }
                  </td>
                  <td className="text-ink-500 max-w-xs truncate">{f.description || '—'}</td>
                  <td><Badge status={f.status} /></td>
                  <td className="text-ink-400 text-xs">{f.rule_groups.length} rule groups</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-ghost text-xs" onClick={() => navigate(`/decision-flows/${f.id}`)}>View</button>
                      <button className="btn-ghost text-xs" onClick={() => { clone(f.id); showToast('Đã clone flow') }}>Clone</button>
                      <button className="btn-ghost text-xs text-red-500 hover:bg-red-50" onClick={() => setDeleteId(f.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Xóa Decision Flow"
        message="Bạn có chắc muốn xóa flow này không?"
        confirmLabel="Xóa"
        danger
        onConfirm={() => { remove(deleteId!); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </PageLayout>
  )
}
