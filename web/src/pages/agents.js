import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { apiFetch } from '../lib/api'
import { useTheme } from './_app'
import {
  Users,
  ShieldCheck,
  Phone,
  Search,
  Filter,
  Upload,
  CheckCircle2,
  XCircle,
  Plus,
  MapPin,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

export default function AgentsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // --- Auth session guard ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) router.replace('/login')
    }
  }, [router])

  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const [agentsList, setAgentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, full_name }
  const [deleting, setDeleting] = useState(false)

  // Status toggle loading
  const [togglingId, setTogglingId] = useState(null)

  // Cascading Location Dropdowns
  const [lgasList, setLgasList] = useState([])
  const [wardsList, setWardsList] = useState([])
  const [pusList, setPusList] = useState([])
  const [selectedLgaId, setSelectedLgaId] = useState('')
  const [selectedWardId, setSelectedWardId] = useState('')
  const [selectedPuId, setSelectedPuId] = useState('')

  // Load LGAs when add modal opens
  useEffect(() => {
    if (showAddModal) {
      apiFetch('/electoral/lgas')
        .then(data => { if (Array.isArray(data)) setLgasList(data) })
        .catch(console.error)
    }
  }, [showAddModal])

  const handleLgaChange = async (lgaId) => {
    setSelectedLgaId(lgaId)
    setSelectedWardId('')
    setSelectedPuId('')
    setWardsList([])
    setPusList([])
    if (lgaId) {
      try {
        const wards = await apiFetch(`/electoral/wards?lga_id=${lgaId}`)
        if (Array.isArray(wards)) setWardsList(wards)
      } catch (err) { console.error(err) }
    }
  }

  const handleWardChange = async (wardId) => {
    setSelectedWardId(wardId)
    setSelectedPuId('')
    setPusList([])
    if (wardId) {
      try {
        const pus = await apiFetch(`/electoral/polling-units?ward_id=${wardId}`)
        if (Array.isArray(pus)) setPusList(pus)
      } catch (err) { console.error(err) }
    }
  }

  const loadAgents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/agents')
      setAgentsList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      if (err.message?.includes('401') || err.message?.includes('403')) {
        router.replace('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadAgents() }, [loadAgents])

  // --- Create agent handler ---
  const handleCreateAgent = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    setFormSuccess('')
    const form = e.target
    try {
      await apiFetch('/agents', {
        method: 'POST',
        body: JSON.stringify({
          full_name: form.full_name.value,
          username: form.username.value,
          password: form.password.value,
          role: 'Polling Unit Agent',
          phone_number: form.phone_number.value,
          lga_id: selectedLgaId ? parseInt(selectedLgaId) : null,
          ward_id: selectedWardId ? parseInt(selectedWardId) : null,
          polling_unit_id: selectedPuId ? parseInt(selectedPuId) : null,
        }),
      })
      setFormSuccess(`Agent '${form.username.value}' created and assigned successfully!`)
      form.reset()
      setSelectedLgaId('')
      setSelectedWardId('')
      setSelectedPuId('')
      setWardsList([])
      setPusList([])
      await loadAgents()
      setTimeout(() => { setShowAddModal(false); setFormSuccess('') }, 1200)
    } catch (err) {
      setFormError(err.message || 'Failed to create agent.')
    } finally {
      setSubmitting(false)
    }
  }

  // --- Status toggle handler ---
  const handleToggleStatus = async (agent) => {
    setTogglingId(agent.id)
    try {
      const newStatus = !agent.is_active
      await apiFetch(`/agents/${agent.id}/status?active=${newStatus}`, { method: 'PATCH' })
      setAgentsList(prev =>
        prev.map(a => a.id === agent.id ? { ...a, is_active: newStatus } : a)
      )
    } catch (err) {
      alert('Failed to toggle agent status: ' + err.message)
    } finally {
      setTogglingId(null)
    }
  }

  // --- Delete handler ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiFetch(`/agents/${deleteTarget.id}`, { method: 'DELETE' })
      setAgentsList(prev => prev.filter(a => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      alert('Failed to delete agent: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  // --- Filtering ---
  const filteredAgents = agentsList.filter((agent) => {
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && agent.is_active) ||
      (statusFilter === 'Inactive' && !agent.is_active)
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (agent.full_name || '').toLowerCase().includes(q) ||
      (agent.phone_number || '').toLowerCase().includes(q) ||
      (agent.username || '').toLowerCase().includes(q) ||
      (agent.role || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const cardClass = isDark
    ? 'bg-[#141E38] border border-slate-800'
    : 'bg-white border border-slate-200 shadow-sm'

  const inputClass = `w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs outline-none focus:border-pdp transition`

  const activeCount = agentsList.filter(a => a.is_active).length
  const inactiveCount = agentsList.filter(a => !a.is_active).length

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Agent Management & Field Tracking"
          subtitle="Real-time field agent roster — create, assign, toggle, and remove agents"
        />

        <main className="p-6 space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Total Agents</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {agentsList.length.toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Authorized users</p>
              </div>
              <div className="p-3 rounded-xl bg-pdp/20 text-pdp"><Users className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-emerald-500/30 rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold text-emerald-500">Active</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activeCount.toLocaleString()}
                  <span className="text-xs text-emerald-500 ml-1">
                    ({agentsList.length ? Math.round(activeCount / agentsList.length * 100) : 0}%)
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">Active accounts</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-rose-500/30 rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold text-rose-500">Suspended</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {inactiveCount.toLocaleString()}
                  <span className="text-xs text-rose-500 ml-1">
                    ({agentsList.length ? Math.round(inactiveCount / agentsList.length * 100) : 0}%)
                  </span>
                </h3>
                <p className="text-[10px] text-rose-500 mt-0.5">Inactive / suspended</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-500"><XCircle className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Roster Controls</span>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    id="add-agent-btn"
                    onClick={() => { setShowAddModal(true); setFormError(''); setFormSuccess('') }}
                    className="bg-pdp hover:bg-pdp-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-md shadow-pdp/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Agent
                  </button>
                  <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 border border-slate-700">
                    <Upload className="w-3.5 h-3.5" /> Import
                  </button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500"><ShieldCheck className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={`${cardClass} rounded-xl p-4 flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {['All', 'Active', 'Inactive'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === st
                      ? 'bg-pdp text-white shadow-md'
                      : isDark ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, username, phone, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Roster Table */}
          <div className={`${cardClass} rounded-xl p-5 shadow-sm space-y-4`}>
            <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Field Agent Telemetry Roster</h3>
              <span className="text-xs font-mono text-slate-400">
                Showing {filteredAgents.length} of {agentsList.length} agents
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-bold">Loading agent roster...</span>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                <Users className="w-8 h-8 opacity-30" />
                <span className="text-xs font-bold">No agents match your filter.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse" id="agents-table">
                  <thead>
                    <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      <th className="py-3 px-3">Agent Name</th>
                      <th className="py-3 px-3">Username</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Phone Number</th>
                      <th className="py-3 px-3">Polling Unit</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                    {filteredAgents.map((ag) => (
                      <tr
                        key={ag.id}
                        className={`transition ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}
                      >
                        {/* Agent Name */}
                        <td className={`py-3 px-3 font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ag.is_active ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                          {ag.full_name}
                        </td>

                        {/* Username */}
                        <td className="py-3 px-3 font-mono text-slate-400">{ag.username}</td>

                        {/* Role */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (ag.role || '').toLowerCase().includes('super') ? 'bg-purple-500/20 text-purple-400' :
                            (ag.role || '').toLowerCase().includes('state') || (ag.role || '').toLowerCase().includes('coordinator') ? 'bg-blue-500/20 text-blue-400' :
                            (ag.role || '').toLowerCase().includes('lga') ? 'bg-amber-500/20 text-amber-400' :
                            (ag.role || '').toLowerCase().includes('ward') ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-pdp/20 text-pdp'
                          }`}>
                            {ag.role}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-3 text-pdp font-mono">{ag.phone_number || '—'}</td>

                        {/* Polling Unit */}
                        <td className="py-3 px-3 text-slate-400 text-[10px]">
                          {ag.polling_unit_id ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                              PU #{ag.polling_unit_id}
                            </span>
                          ) : '—'}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            id={`toggle-status-${ag.id}`}
                            title={ag.is_active ? 'Click to suspend agent' : 'Click to activate agent'}
                            onClick={() => handleToggleStatus(ag)}
                            disabled={togglingId === ag.id}
                            className="flex items-center gap-1 mx-auto transition disabled:opacity-50"
                          >
                            {togglingId === ag.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            ) : ag.is_active ? (
                              <>
                                <ToggleRight className="w-5 h-5 text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-400">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-5 h-5 text-rose-400" />
                                <span className="text-[10px] font-bold text-rose-400">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Delete Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            id={`delete-agent-${ag.id}`}
                            title={`Delete ${ag.full_name}`}
                            onClick={() => setDeleteTarget({ id: ag.id, full_name: ag.full_name, username: ag.username })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-rose-400 hover:text-white hover:bg-rose-600/80 border border-rose-500/30 hover:border-rose-600 transition active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ===================== ADD AGENT MODAL ===================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${cardClass} w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4`}>
            <div className={`flex justify-between items-center pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Plus className="w-4 h-4 text-pdp" /> Register & Assign Polling Agent
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
            </div>

            {/* Success / Error banners */}
            {formSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {formSuccess}
              </div>
            )}
            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            <form onSubmit={handleCreateAgent} id="create-agent-form" className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">

              <div>
                <label className="block font-bold mb-1 text-slate-400">Agent Full Name *</label>
                <input required name="full_name" id="input-full-name" type="text" placeholder="e.g. Ibrahim Suleiman Musa" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Username *</label>
                  <input required name="username" id="input-username" type="text" placeholder="e.g. agent_dutse_01" className={inputClass} />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Password *</label>
                  <input required name="password" id="input-password" type="password" placeholder="••••••••" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Phone Number</label>
                <input name="phone_number" id="input-phone" type="text" placeholder="0801 234 5678" className={inputClass} />
              </div>

              {/* Cascading Location Assignment */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2.5 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Assigned Polling Location
                  </span>
                  <span className="text-[10px] text-slate-400">Required for PU Agents</span>
                </div>

                {/* 1. LGA */}
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-400">1. Local Government Area (LGA)</label>
                  <select
                    id="select-lga"
                    value={selectedLgaId}
                    onChange={(e) => handleLgaChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-pdp"
                  >
                    <option value="">— Select LGA (27 LGAs) —</option>
                    {lgasList.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>

                {/* 2. Ward */}
                {selectedLgaId && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-[10px] font-bold mb-1 text-slate-400">2. Electoral Ward</label>
                    <select
                      id="select-ward"
                      value={selectedWardId}
                      onChange={(e) => handleWardChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-pdp"
                    >
                      <option value="">— Select Ward —</option>
                      {wardsList.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. Polling Unit */}
                {selectedWardId && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-[10px] font-bold mb-1 text-slate-400">3. Designated Polling Unit (PU)</label>
                    <select
                      id="select-pu"
                      value={selectedPuId}
                      onChange={(e) => setSelectedPuId(e.target.value)}
                      className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-emerald-500"
                    >
                      <option value="">— Select Polling Unit —</option>
                      {pusList.map(pu => (
                        <option key={pu.id} value={pu.id}>[{pu.code}] {pu.name} ({pu.registered_voters || 0} voters)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-700">
                  Cancel
                </button>
                <button
                  id="submit-create-agent"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-pdp text-white font-bold text-xs rounded-lg hover:bg-pdp-dark shadow-md shadow-pdp/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Authorize & Save Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${cardClass} w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Confirm Agent Removal</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className={`p-3 rounded-xl text-xs ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
              <p className="text-slate-400">You are about to permanently remove:</p>
              <p className={`font-bold text-sm mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{deleteTarget.full_name}</p>
              <p className="text-slate-500 font-mono text-[10px]">@{deleteTarget.username}</p>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                id="cancel-delete-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
              >
                {deleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...</> : <><Trash2 className="w-3.5 h-3.5" /> Yes, Remove Agent</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
