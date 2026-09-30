
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
  CheckCircle2,
  XCircle,
  MapPin,
  Loader2,
  RefreshCw,
  Eye,
  Wifi,
  WifiOff,
  Clock,
  User,
  X,
  AlertTriangle,
  Trash2,
  UserCheck,
  UserX,
  AlertCircle,
} from 'lucide-react'

export default function AgentsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [agentsList, setAgentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [deleteConfirmAgent, setDeleteConfirmAgent] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.replace('/login')
    }
  }, [router])

  const loadAgents = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiFetch('/agents?limit=200')

      // Accept the response formats currently commonly used by APIs.
      const records = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.agents)
            ? data.agents
            : null

      if (!records) {
        throw new Error('The agents API returned an unsupported response.')
      }

      setAgentsList(records)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load agents:', err)
      setError(err.message || 'Unable to load agents from the server.')

      if (err.message?.includes('401') || err.message?.includes('403')) {
        router.replace('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  const handleToggleSuspend = async (agent) => {
    const newStatus = !getActive(agent)
    const actionName = newStatus ? 'activate' : 'suspend'
    if (!window.confirm(`Are you sure you want to ${actionName} agent @${agent.username || agent.name}?`)) {
      return
    }
    setActionLoading(agent.id)
    try {
      await apiFetch(`/agents/${agent.id}/status?active=${newStatus}`, {
        method: 'PATCH'
      })
      setAgentsList(prev => prev.map(a => a.id === agent.id ? { ...a, is_active: newStatus } : a))
      if (selectedAgent && selectedAgent.id === agent.id) {
        setSelectedAgent(prev => ({ ...prev, is_active: newStatus }))
      }
      setToastMessage(`Agent @${agent.username} ${newStatus ? 'activated' : 'suspended'} successfully!`)
      setTimeout(() => setToastMessage(''), 4000)
    } catch (err) {
      alert(`Failed to update agent status: ${err.message || 'Server error'}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAgent = async (agent) => {
    setActionLoading(agent.id)
    try {
      const res = await apiFetch(`/agents/${agent.id}`, {
        method: 'DELETE'
      })
      setAgentsList(prev => prev.filter(a => a.id !== agent.id))
      if (selectedAgent && selectedAgent.id === agent.id) {
        setSelectedAgent(null)
      }
      setDeleteConfirmAgent(null)
      setToastMessage(res?.message || `Agent @${agent.username} deleted successfully!`)
      setTimeout(() => setToastMessage(''), 4000)
    } catch (err) {
      alert(`Failed to delete agent: ${err.message || 'Server error'}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getActive = (agent) =>
    agent.is_active === true ||
    agent.is_active === 1 ||
    agent.is_active === 'true'

    const getOnline = (agent) => {
    const value =
      agent.is_online ??
      agent.online ??
      agent.isOnline ??
      agent.connection_status

    if (typeof value === 'boolean') return value
    if (value === 1 || value === 'true') return true
    if (value === 0 || value === 'false') return false

    if (typeof value === 'string') {
      const normalized = value.toLowerCase()
      if (normalized === 'online') return true
      if (normalized === 'offline') return false
    }

    return null
  }

  const filteredAgents = agentsList.filter((agent) => {
    const active = getActive(agent)

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && active) ||
      (statusFilter === 'Inactive' && !active)

    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      [
        agent.full_name,
        agent.name,
        agent.username,
        agent.phone_number,
        agent.phone,
        agent.role,
        agent.polling_unit_name,
        agent.polling_unit_code,
        agent.lga_name,
        agent.ward_name,
      ].some((value) => String(value || '').toLowerCase().includes(q))

    return matchesStatus && matchesSearch
  })

  const activeCount = agentsList.filter(getActive).length
  const inactiveCount = agentsList.length - activeCount
  const onlineCount = agentsList.filter((agent) => getOnline(agent) === true).length
  const offlineCount = agentsList.filter((agent) => getOnline(agent) === false).length
  const onlineAvailable = agentsList.some((agent) => getOnline(agent) !== null)

  const cardClass = isDark
    ? 'bg-[#141E38] border border-slate-800'
    : 'bg-white border border-slate-200 shadow-sm'

  const textMain = isDark ? 'text-white' : 'text-slate-900'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'

  const formatDate = (value) => {
    if (!value) return 'Not available'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Not available'
    return date.toLocaleString()
  }

  const statusBadge = (active) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        active
          ? 'bg-emerald-500/15 text-emerald-500'
          : 'bg-rose-500/15 text-rose-500'
      }`}
    >
      {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {active ? 'Active' : 'Inactive'}
    </span>
  )

  const onlineBadge = (agent) => {
    const online = getOnline(agent)

    if (online === null) {
      return (
        <span className="text-[10px] text-slate-400">
          Unavailable
        </span>
      )
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          online
            ? 'bg-emerald-500/15 text-emerald-500'
            : 'bg-slate-500/15 text-slate-400'
        }`}
      >
        {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {online ? 'Online' : 'Offline'}
      </span>
    )
  }

  return (
    <div
      className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Agent Monitoring"
          subtitle="Live roster and field-agent status from the shared backend"
        />

        <main className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={`text-lg font-extrabold ${textMain}`}>
                Field Agents
              </h2>
              <p className={`text-xs mt-1 ${muted}`}>
                Read-only monitoring. Agent registration and management are handled through Side A.
              </p>
            </div>

            <button
              onClick={loadAgents}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-500">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold">Could not load live agent data</p>
                <p className="text-xs mt-1 break-words">{error}</p>
                <button
                  onClick={loadAgents}
                  className="mt-2 text-xs font-bold underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className={`text-xs font-bold ${muted}`}>Total Agents</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${textMain}`}>
                  {loading && agentsList.length === 0 ? '—' : agentsList.length.toLocaleString()}
                </h3>
                <p className={`text-[10px] mt-1 ${muted}`}>Backend records</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/15 text-blue-500">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold text-emerald-500">Active</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${textMain}`}>
                  {loading && agentsList.length === 0 ? '—' : activeCount.toLocaleString()}
                </h3>
                <p className="text-[10px] text-emerald-500 mt-1">Enabled accounts</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold text-rose-500">Inactive</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${textMain}`}>
                  {loading && agentsList.length === 0 ? '—' : inactiveCount.toLocaleString()}
                </h3>
                <p className="text-[10px] text-rose-500 mt-1">Disabled accounts</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/15 text-rose-500">
                <XCircle className="w-6 h-6" />
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className={`text-xs font-bold ${muted}`}>Online Agents</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${textMain}`}>
                  {loading && agentsList.length === 0
                    ? '—'
                    : onlineAvailable
                      ? onlineCount.toLocaleString()
                      : '—'}
                </h3>
                <p className={`text-[10px] mt-1 ${muted}`}>
                  {onlineAvailable
                    ? `${offlineCount} offline`
                    : 'Connection data unavailable'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-500">
                <Wifi className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-xl p-4 flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold flex items-center gap-1 ${muted}`}>
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {['All', 'Active', 'Inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === status
                      ? 'bg-pdp text-white'
                      : isDark
                        ? 'bg-slate-900 text-slate-400 border border-slate-800'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, username, phone, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <div className={`${cardClass} rounded-xl p-5 space-y-4`}>
            <div className={`flex flex-wrap justify-between items-center gap-2 pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <h3 className={`text-xs font-bold ${textMain}`}>
                Agent Roster
              </h3>
              <div className={`text-xs ${muted}`}>
                Showing {filteredAgents.length} of {agentsList.length} agents
                {lastUpdated && (
                  <span className="ml-2">
                    · Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {loading && agentsList.length === 0 ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-bold">Loading live agent roster...</span>
              </div>
            ) : !error && filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                <Users className="w-8 h-8 opacity-30" />
                <span className="text-xs font-bold">
                  {agentsList.length === 0
                    ? 'No agents have been returned by the backend.'
                    : 'No agents match your filter.'}
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse" id="agents-table">
                  <thead>
                    <tr className={`border-y text-slate-500 font-bold ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <th className="py-3 px-3">Agent Name</th>
                      <th className="py-3 px-3">Username</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Phone Number</th>
                      <th className="py-3 px-3">Polling Unit</th>
                      <th className="py-3 px-3 text-center">Account Status</th>
                      <th className="py-3 px-3 text-center">Connection</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-medium ${
                    isDark ? 'divide-slate-800/80' : 'divide-slate-100'
                  }`}>
                    {filteredAgents.map((agent) => (
                      <tr
                        key={agent.id ?? agent.username}
                        className={`transition ${
                          isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className={`py-3 px-3 font-bold ${textMain}`}>
                          <span className="inline-flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              getActive(agent) ? 'bg-emerald-400' : 'bg-rose-500'
                            }`} />
                            {agent.full_name || agent.name || 'Name unavailable'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {agent.username || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-1 rounded bg-pdp/10 text-pdp text-[10px] font-bold">
                            Polling Unit Agent
                          </span>
                        </td>
                        <td className="py-3 px-3 text-pdp font-mono">
                          {agent.phone_number || agent.phone || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[10px]">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            {agent.polling_unit_name ||
                              agent.polling_unit_code ||
                              (agent.polling_unit_id
                                ? `PU #${agent.polling_unit_id}`
                                : 'Not assigned')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {statusBadge(getActive(agent))}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {onlineBadge(agent)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <button
                              onClick={() => setSelectedAgent(agent)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-pdp border border-pdp/30 hover:bg-pdp hover:text-white transition"
                              title="View Details"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => handleToggleSuspend(agent)}
                              disabled={actionLoading === agent.id}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                getActive(agent)
                                  ? 'text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                  : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              }`}
                              title={getActive(agent) ? 'Suspend Agent Account' : 'Activate Agent Account'}
                            >
                              {actionLoading === agent.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : getActive(agent) ? (
                                <>
                                  <UserX className="w-3 h-3" />
                                  <span>Suspend</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setDeleteConfirmAgent(agent)}
                              disabled={actionLoading === agent.id}
                              className="inline-flex items-center p-1 rounded-lg text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition"
                              title="Delete Agent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {selectedAgent && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className={`${cardClass} w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between gap-3 pb-4 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div>
                <h3 className={`text-base font-extrabold ${textMain}`}>
                  Agent Details
                </h3>
                <p className={`text-xs mt-1 ${muted}`}>
                  Live information returned by the backend
                </p>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className={`p-2 rounded-lg ${
                  isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 py-5">
              <div className="w-12 h-12 rounded-xl bg-pdp/15 text-pdp flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`font-extrabold ${textMain}`}>
                  {selectedAgent.full_name || selectedAgent.name || 'Name unavailable'}
                </h4>
                <p className="text-xs text-slate-400">
                  @{selectedAgent.username || 'username unavailable'}
                </p>
              </div>
              {statusBadge(getActive(selectedAgent))}
              {onlineBadge(selectedAgent)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['Full Name', selectedAgent.full_name || selectedAgent.name],
                ['Username', selectedAgent.username],
                ['Role', 'Polling Unit Agent'],
                ['Phone Number', selectedAgent.phone_number || selectedAgent.phone],
                ['Agent ID', selectedAgent.id],
                ['LGA', selectedAgent.lga_name || selectedAgent.lga?.name || selectedAgent.lga_id],
                ['Ward', selectedAgent.ward_name || selectedAgent.ward?.name || selectedAgent.ward_id],
                ['Polling Unit', selectedAgent.polling_unit_name || selectedAgent.polling_unit_code || selectedAgent.polling_unit_id],
                ['Account Status', getActive(selectedAgent) ? 'Active' : 'Inactive'],
                ['Online Status', getOnline(selectedAgent) === null ? 'Unavailable' : getOnline(selectedAgent) ? 'Online' : 'Offline'],
                ['Last Seen', formatDate(selectedAgent.last_seen || selectedAgent.last_seen_at || selectedAgent.last_activity_at)],
                ['Created At', formatDate(selectedAgent.created_at)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-lg border p-3 ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className={`text-xs font-semibold mt-1 break-words ${textMain}`}>
                    {value === null || value === undefined || value === ''
                      ? 'Not available'
                      : String(value)}
                  </p>
                </div>
              ))}
            </div>

            <div className={`mt-4 rounded-lg p-3 flex items-start gap-2 ${
              isDark ? 'bg-slate-900/60' : 'bg-slate-50'
            }`}>
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className={`text-[10px] ${muted}`}>
                Online status and last-seen time depend on information provided by the backend. Missing values are shown as unavailable, not estimated.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleSuspend(selectedAgent)}
                  disabled={actionLoading === selectedAgent.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition inline-flex items-center gap-1.5 ${
                    getActive(selectedAgent)
                      ? 'text-amber-400 border-amber-500/40 hover:bg-amber-500/20'
                      : 'text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                  }`}
                >
                  {getActive(selectedAgent) ? (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>Suspend Account</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Activate Account</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setDeleteConfirmAgent(selectedAgent)}
                  disabled={actionLoading === selectedAgent.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 transition inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Agent</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmAgent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${cardClass} max-w-md w-full rounded-2xl p-6 border border-rose-500/30 shadow-2xl space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm Delete Agent</h3>
                <p className="text-xs text-slate-400">@{deleteConfirmAgent.username} ({deleteConfirmAgent.full_name || 'Agent'})</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this agent? If this agent has already submitted election results or incident reports, they will be safely deactivated to preserve legal tribunal integrity.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmAgent(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAgent(deleteConfirmAgent)}
                disabled={actionLoading === deleteConfirmAgent.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                {actionLoading === deleteConfirmAgent.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}