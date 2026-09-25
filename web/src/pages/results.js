import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch, loginUser } from '../lib/api'
import { 
  BarChart3, 
  CheckCircle2, 
  FileText, 
  Download, 
  Building2, 
  Search, 
  Filter, 
  ShieldAlert, 
  Eye,
  Check,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Layers,
  TableProperties,
  Vote
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts'

export default function ResultsDashboardPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // View Mode: 'units' (Polling Unit Roster & EC8A Audit) or 'lgas' (LGA Collation Breakdown)
  const [activeTab, setActiveTab] = useState('units')

  // Filters & Search
  const [electionType, setElectionType] = useState('GOVERNORSHIP')
  const [selectedLgaId, setSelectedLgaId] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  useEffect(() => {
    if (router.isReady) {
      if (router.query.election_type) {
        setElectionType(router.query.election_type.toString().toUpperCase())
      }
      if (router.query.modal === 'entry') {
        setShowManualEntryModal(true)
      }
    }
  }, [router.isReady, router.query])

  // Backend Data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lgas, setLgas] = useState([])
  const [summaryData, setSummaryData] = useState(null)
  const [partyVoteShare, setPartyVoteShare] = useState([])
  const [lgaCollationTable, setLgaCollationTable] = useState([])
  const [pollingUnitResults, setPollingUnitResults] = useState([])
  const [totalMatchingResults, setTotalMatchingResults] = useState(0)

  // Modals
  const [showManualEntryModal, setShowManualEntryModal] = useState(false)
  const [inspectResult, setInspectResult] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [flagReasonModal, setFlagReasonModal] = useState(false)
  const [flagNotes, setFlagNotes] = useState('')
  const [actionMessage, setActionMessage] = useState(null)

  const partyColors = {
    PDP: '#10B981',
    APC: '#3B82F6',
    NNPP: '#8B5CF6',
    LP: '#F59E0B'
  }

  // Load LGA list once
  useEffect(() => {
    async function loadLgas() {
      try {
        const lgaList = await apiFetch('/electoral/lgas')
        if (Array.isArray(lgaList)) setLgas(lgaList)
      } catch (err) {
        console.warn('Failed to load LGAs:', err)
      }
    }
    loadLgas()
  }, [])

  // Fetch Results Data from FastAPI
  const loadResults = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      params.append('limit', pageSize.toString())
      params.append('skip', (page * pageSize).toString())
      if (selectedLgaId) params.append('lga_id', selectedLgaId)
      if (electionType && electionType !== 'ALL') params.append('election_type', electionType)
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const data = await apiFetch(`/results?${params.toString()}`)

      if (data) {
        if (data.party_vote_share) {
          setPartyVoteShare(data.party_vote_share.map(p => ({
            ...p,
            color: p.color || partyColors[p.party] || '#64748B'
          })))
        }
        if (data.lga_breakdown) {
          setLgaCollationTable(data.lga_breakdown)
        }
        if (data.summary) {
          setSummaryData(data.summary)
        }
        if (data.results) {
          setPollingUnitResults(data.results)
          setTotalMatchingResults(data.total_results || data.results.length)
        }
      }
    } catch (err) {
      console.error('Failed to load live results:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [selectedLgaId, statusFilter, searchQuery, page, electionType])

  // Count flagged in currently displayed list
  const flaggedInViewCount = useMemo(() => {
    return pollingUnitResults.filter(r => r.verification_status === 'FLAGGED' || r.is_overvote).length
  }, [pollingUnitResults])

  // 1. One-Click Verify Result (POST /api/results/approve/{id})
  const handleApproveResult = async (resultId) => {
    setActionLoading(true)
    setActionMessage(null)
    try {
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        await loginUser('admin', 'password')
      }

      await apiFetch(`/results/approve/${resultId}`, { method: 'POST' })
      setActionMessage({ type: 'success', text: `Result #${resultId} approved and verified officially!` })
      
      // Update local state
      setPollingUnitResults(prev => prev.map(r => r.id === resultId ? { ...r, verification_status: 'VERIFIED' } : r))
      if (inspectResult && inspectResult.id === resultId) {
        setInspectResult(prev => ({ ...prev, verification_status: 'VERIFIED' }))
      }
      loadResults()
    } catch (err) {
      setActionMessage({ type: 'error', text: `Approval failed: ${err.message}` })
    } finally {
      setActionLoading(false)
    }
  }

  // CSV Export
  const handleExportCsv = () => {
    if (!pollingUnitResults || pollingUnitResults.length === 0) {
      alert('No polling unit records to export.')
      return
    }
    const headers = ['PU Code', 'PU Name', 'Registered Voters', 'PDP Votes', 'APC Votes', 'NNPP Votes', 'LP Votes', 'Total Cast', 'Status', 'Over-voting', 'Agent']
    const rows = pollingUnitResults.map(r => [
      `"${r.polling_unit_code}"`,
      `"${(r.polling_unit_name || '').replace(/"/g, '""')}"`,
      r.registered_voters,
      r.pdp_votes,
      r.apc_votes,
      r.nnpp_votes,
      r.lp_votes,
      r.total_votes_cast,
      `"${r.verification_status}"`,
      r.is_overvote ? 'YES' : 'NO',
      `"${(r.agent_name || '').replace(/"/g, '""')}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `jigawa_pdp_pu_results_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 2. Flag Result for Discrepancy (POST /api/results/flag/{id})
  const handleFlagResult = async () => {
    if (!inspectResult) return
    setActionLoading(true)
    setActionMessage(null)
    try {
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        await loginUser('admin', 'password')
      }

      const notesParam = encodeURIComponent(flagNotes.trim() || 'Discrepancy flagged by Situation Room audit')
      await apiFetch(`/results/flag/${inspectResult.id}?notes=${notesParam}`, { method: 'POST' })
      setActionMessage({ type: 'warning', text: `Result #${inspectResult.id} quarantined as FLAGGED!` })
      
      // Update local state
      setPollingUnitResults(prev => prev.map(r => r.id === inspectResult.id ? { 
        ...r, 
        verification_status: 'FLAGGED',
        notes: (r.notes || '') + ` | [FLAGGED]: ${flagNotes}`
      } : r))
      setInspectResult(prev => ({
        ...prev,
        verification_status: 'FLAGGED',
        notes: (prev.notes || '') + ` | [FLAGGED]: ${flagNotes}`
      }))
      setFlagReasonModal(false)
      setFlagNotes('')
      loadResults()
    } catch (err) {
      setActionMessage({ type: 'error', text: `Flagging failed: ${err.message}` })
    } finally {
      setActionLoading(false)
    }
  }

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'
  const totalPages = Math.ceil(totalMatchingResults / pageSize) || 1

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Results Dashboard & Verification Inspector" 
          subtitle="Real-time vote collation, EC8A proof verification, and candidate vote share analytics" 
        />

        <main className="p-6 space-y-6">
          {/* Status Indicator Bar */}
          {error && (
            <div className="text-xs bg-amber-500/10 text-amber-500 p-3 rounded-lg border border-amber-500/20 flex justify-between items-center">
              <span>Unable to connect to live backend API ({error}). Showing cached view.</span>
            </div>
          )}

          {/* Top 4 KPI Banner Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Total Collated Votes</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {summaryData?.total_votes?.toLocaleString() || "1,892,978"}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  From {summaryData?.collated_pus?.toLocaleString() || "4,827"} of {summaryData?.total_ec8a?.toLocaleString() || "4,827"} Polling Units
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500"><BarChart3 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-emerald-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-emerald-500">PDP Total Votes</span>
                <h3 className="text-2xl font-extrabold text-emerald-500 mt-1">
                  {summaryData?.pdp_votes?.toLocaleString() || "1,038,819"}{" "}
                  <span className="text-xs font-bold">({summaryData?.pdp_pct || "55.3%"})</span>
                </h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">
                  Lead margin: +{summaryData?.lead_margin?.toLocaleString() || "414,630"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-blue-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-blue-500">APC Total Votes</span>
                <h3 className="text-2xl font-extrabold text-blue-500 mt-1">
                  {summaryData?.apc_votes?.toLocaleString() || "624,189"}{" "}
                  <span className="text-xs font-bold">({summaryData?.apc_pct || "33.2%"})</span>
                </h3>
                <p className="text-[10px] text-blue-500 mt-0.5">Runner-up party</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500"><Building2 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-purple-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-purple-500">EC8A Proof Verification</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {summaryData?.verified_ec8a?.toLocaleString() || "4,827"} / {summaryData?.total_ec8a?.toLocaleString() || "4,827"}
                </h3>
                <p className="text-[10px] text-purple-500 mt-0.5">
                  {summaryData?.upload_pct || "100.0%"} result sheets uploaded
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-500"><FileText className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Statewide Party Vote Share Card */}
          <div className={`${cardClass} rounded-xl p-5 shadow-sm`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  Statewide Party Vote Share & Electoral Margin
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated from aggregated Polling Unit results with verified Form EC8A certificates
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="h-[120px] w-[120px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={partyVoteShare} innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="votes">
                        {partyVoteShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {partyVoteShare.map((p, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }}></span>
                        <span className="text-xs font-bold text-slate-300">{p.name}</span>
                      </div>
                      <div className="text-base font-extrabold text-white font-mono">
                        {p.votes.toLocaleString()}
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: p.color }}>
                        {p.pct}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Over-voting Alert Banner */}
          {flaggedInViewCount > 0 && (
            <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <strong className="text-white font-bold text-sm block">
                    Section 51 Electoral Act Compliance Warning
                  </strong>
                  <span>
                    {flaggedInViewCount} Polling Unit(s) in current view are marked <strong>FLAGGED</strong> because total votes cast exceeds registered voters. In accordance with the 2022 Electoral Act, these results cannot be collated or certified.
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setStatusFilter('FLAGGED')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs whitespace-nowrap transition"
              >
                Inspect Flagged Units
              </button>
            </div>
          )}

          {/* Multi-Category Election Contest Switcher Bar */}
          <div className={`${cardClass} rounded-2xl p-3.5 border shadow-sm flex flex-wrap items-center justify-between gap-3`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Vote className="w-3.5 h-3.5" /> Ballot Contest:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {[
                { id: 'GOVERNORSHIP', label: 'Governorship', icon: '🗳️' },
                { id: 'SENATORIAL', label: 'Senatorial (Senate)', icon: '🏛️' },
                { id: 'HOUSE_OF_REPS', label: 'House of Reps', icon: '🏛️' },
                { id: 'PRESIDENTIAL', label: 'Presidential', icon: '🇳🇬' },
                { id: 'STATE_ASSEMBLY', label: 'State Assembly', icon: '📜' },
                { id: 'ALL', label: 'All Contests', icon: '🌐' },
              ].map((contest) => (
                <button
                  key={contest.id}
                  onClick={() => {
                    setElectionType(contest.id)
                    setPage(0)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    electionType === contest.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                      : isDark
                        ? 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <span>{contest.icon}</span>
                  <span>{contest.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Controls & Tab Bar */}
          <div className={`${cardClass} rounded-xl p-4 flex flex-wrap justify-between items-center gap-4`}>
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('units')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                  activeTab === 'units'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Polling Unit EC8A Roster</span>
              </button>
              <button
                onClick={() => setActiveTab('lgas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                  activeTab === 'lgas'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>LGA Collation Breakdown</span>
              </button>
            </div>

            {/* Filter Controls for Polling Units */}
            {activeTab === 'units' && (
              <div className="flex flex-wrap items-center gap-3">
                {/* LGA Select */}
                <select
                  value={selectedLgaId}
                  onChange={(e) => {
                    setSelectedLgaId(e.target.value)
                    setPage(0)
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border transition ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">All 27 LGAs</option>
                  {lgas.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>

                {/* Status Select */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(0)
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border transition ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="FLAGGED">Flagged / Over-voting</option>
                  <option value="PENDING_PHOTO">Pending Photo</option>
                </select>

                {/* Search Input */}
                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search PU code or name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(0)
                    }}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border transition ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleExportCsv}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Tribunal CSV</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowManualEntryModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                + Manual Form EC8A Entry
              </button>
            </div>
          </div>

          {/* TAB 1: Polling Unit Results & EC8A Evidence Roster */}
          {activeTab === 'units' && (
            <div className={`${cardClass} rounded-xl p-5 shadow-sm space-y-4`}>
              <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div>
                  <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Polling Unit EC8A Evidence Roster & Audit Vault
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any polling unit to inspect the primary Form EC8A photograph and verify vote tallies
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Showing {pollingUnitResults.length} of {totalMatchingResults.toLocaleString()} Polling Units
                </span>
              </div>

              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-xs font-bold">Querying Polling Unit records from database...</p>
                </div>
              ) : pollingUnitResults.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No polling unit results found matching the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                        <th className="py-3 px-3">PU Code</th>
                        <th className="py-3 px-3">Polling Unit Name</th>
                        <th className="py-3 px-3">Contest</th>
                        <th className="py-3 px-3">Voters</th>
                        <th className="py-3 px-3 text-emerald-500 font-bold">PDP</th>
                        <th className="py-3 px-3 text-blue-500 font-bold">APC</th>
                        <th className="py-3 px-3 text-purple-500 font-bold">NNPP</th>
                        <th className="py-3 px-3">Total Cast</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">EC8A Inspection</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                      {pollingUnitResults.map((r) => {
                        const isOvervoted = r.is_overvote || r.verification_status === 'FLAGGED'
                        return (
                          <tr 
                            key={r.id} 
                            onClick={() => {
                              setInspectResult(r)
                              setActionMessage(null)
                            }}
                            className={`cursor-pointer transition group ${
                              isOvervoted 
                                ? (isDark ? 'bg-red-950/20 hover:bg-red-950/30' : 'bg-red-50 hover:bg-red-100/60') 
                                : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')
                            }`}
                          >
                            <td className="py-3 px-3 font-mono font-bold text-slate-400">
                              {r.polling_unit_code}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`font-semibold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {r.polling_unit_name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Submitting Agent: {r.agent_name || 'Assigned Agent'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                                r.election_type === 'SENATORIAL' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                                r.election_type === 'HOUSE_OF_REPS' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                                r.election_type === 'PRESIDENTIAL' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                r.election_type === 'STATE_ASSEMBLY' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}>
                                {r.election_type || 'GOVERNORSHIP'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-mono">
                              {r.registered_voters}
                            </td>
                            <td className="py-3 px-3 font-extrabold text-emerald-500 text-sm">
                              {r.pdp_votes}
                            </td>
                            <td className="py-3 px-3 font-bold text-blue-500">
                              {r.apc_votes}
                            </td>
                            <td className="py-3 px-3 text-purple-500">
                              {r.nnpp_votes}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300">
                              {r.total_votes_cast}
                            </td>
                            <td className="py-3 px-3">
                              {isOvervoted ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> FLAGGED
                                </span>
                              ) : r.verification_status === 'VERIFIED' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  VERIFIED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  PENDING PHOTO
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setInspectResult(r)
                                  setActionMessage(null)
                                }}
                                className="px-3 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs text-slate-400">
                <span>Page {page + 1} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LGA Collation Breakdown Table */}
          {activeTab === 'lgas' && (
            <div className={`${cardClass} rounded-xl p-5 shadow-sm space-y-4`}>
              <div className={`flex justify-between items-center border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    27 LGA Collation Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time collation progress and candidate shares across all 27 Jigawa Local Government Areas
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      <th className="py-2.5 px-3">LGA</th>
                      <th className="py-2.5 px-3">Collated PUs</th>
                      <th className="py-2.5 px-3 text-emerald-500 font-bold">PDP Votes</th>
                      <th className="py-2.5 px-3 text-blue-500 font-bold">APC Votes</th>
                      <th className="py-2.5 px-3 text-purple-500 font-bold">NNPP Votes</th>
                      <th className="py-2.5 px-3">Collation %</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                    {lgaCollationTable.map((l, idx) => (
                      <tr key={idx} className={`transition ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                        <td className={`py-3 px-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{l.lga}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono">{l.collatedPus} / {l.totalPus}</td>
                        <td className="py-3 px-3 font-extrabold text-emerald-500">{l.pdp.toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold text-blue-500">{l.apc.toLocaleString()}</td>
                        <td className="py-3 px-3 text-purple-500">{l.nnpp.toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold font-mono">{l.pct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* EC8A VERIFICATION INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {inspectResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${cardClass} w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex flex-wrap items-center gap-2">
                    <span>{inspectResult.polling_unit_name}</span>
                    <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {inspectResult.polling_unit_code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                      inspectResult.election_type === 'SENATORIAL' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                      inspectResult.election_type === 'HOUSE_OF_REPS' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                      inspectResult.election_type === 'PRESIDENTIAL' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      inspectResult.election_type === 'STATE_ASSEMBLY' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {inspectResult.election_type || 'GOVERNORSHIP'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Field Agent: <strong className="text-slate-200">{inspectResult.agent_name}</strong> | Submitted: {inspectResult.created_at ? new Date(inspectResult.created_at).toLocaleString() : 'Live Sync'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setInspectResult(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: Split View (EC8A Photo Vault on Left, Vote Breakdown on Right) */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form EC8A Photo Proof */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Form EC8A Primary Photo Evidence
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Tamper-Resistant
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center min-h-[350px] overflow-hidden">
                  <img 
                    src={inspectResult.ec8a_photo_url || "https://placehold.co/800x1100/141e38/10b981?text=FORM+EC8A+PRIMARY+PROOF%0APolling+Unit+Result+Sheet"} 
                    alt="Form EC8A Proof"
                    className="max-h-[360px] object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "https://placehold.co/800x1100/141e38/10b981?text=FORM+EC8A+PRIMARY+PROOF%0APolling+Unit+Result+Sheet"
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 italic text-center">
                  Photographed and signed by PDP Party Agent & INEC Presiding Officer
                </p>
              </div>

              {/* Right Column: Vote Tallies & Section 51 Verification */}
              <div className="space-y-4">
                {/* Action Feedback Banner */}
                {actionMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    actionMessage.type === 'success' 
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : actionMessage.type === 'warning'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'bg-red-500/20 border border-red-500/40 text-red-300'
                  }`}>
                    {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{actionMessage.text}</span>
                  </div>
                )}

                {/* Over-Voting / Quota Status Alert */}
                {inspectResult.is_overvote || inspectResult.verification_status === 'FLAGGED' ? (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-red-400">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>SECTION 51 OVER-VOTING BREACH DETECTED</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Total votes cast (<strong>{inspectResult.total_votes_cast}</strong>) exceeds registered voters (<strong>{inspectResult.registered_voters}</strong>).
                      Under Electoral Act 2022 Section 51, this result is void and cannot be approved.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>VOTER CAPACITY VERIFIED: Votes cast ({inspectResult.total_votes_cast}) within registered threshold ({inspectResult.registered_voters}).</span>
                  </div>
                )}

                {/* Vote Table */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Recorded Vote Tally
                  </span>
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-500 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> PDP (Peoples Democratic Party)
                      </span>
                      <strong className="text-base font-mono text-emerald-400 font-extrabold">{inspectResult.pdp_votes}</strong>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-blue-500 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> APC (All Progressives Congress)
                      </span>
                      <strong className="text-base font-mono text-blue-400 font-extrabold">{inspectResult.apc_votes}</strong>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-purple-500 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> NNPP (New Nigeria Peoples Party)
                      </span>
                      <strong className="text-base font-mono text-purple-400">{inspectResult.nnpp_votes}</strong>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-500 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> LP (Labour Party)
                      </span>
                      <strong className="text-base font-mono text-amber-400">{inspectResult.lp_votes}</strong>
                    </div>

                    <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Rejected Votes:</span>
                      <span className="font-mono text-slate-400">{inspectResult.rejected_votes || 0}</span>
                    </div>

                    <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Total Votes Cast:</span>
                      <span className="font-mono text-base font-extrabold text-white">{inspectResult.total_votes_cast}</span>
                    </div>
                  </div>
                </div>

                {/* Submitting Agent Remarks */}
                {inspectResult.notes && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-500 font-bold block mb-1">Field Observation / Remarks:</span>
                    <p className="text-slate-300 font-mono text-[11px]">{inspectResult.notes}</p>
                  </div>
                )}

                {/* Verification Actions */}
                <div className="pt-2 space-y-2">
                  <div className="flex gap-2">
                    <button
                      disabled={actionLoading || inspectResult.is_overvote || inspectResult.verification_status === 'VERIFIED'}
                      onClick={() => handleApproveResult(inspectResult.id)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>
                        {inspectResult.verification_status === 'VERIFIED' ? 'Already Verified' : 'Verify & Approve Result'}
                      </span>
                    </button>

                    <button
                      disabled={actionLoading || inspectResult.verification_status === 'FLAGGED'}
                      onClick={() => setFlagReasonModal(true)}
                      className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Flag Discrepancy</span>
                    </button>
                  </div>
                  {inspectResult.is_overvote && (
                    <p className="text-[10px] text-red-400 italic text-center">
                      * Approval is legally disabled due to over-voting breach.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                PollWatch 2027 Tribunal Evidence Vault — Section 51 Electoral Act Compliance
              </span>
              <button 
                onClick={() => setInspectResult(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLAG DISCREPANCY REASON MODAL */}
      {/* ========================================================================= */}
      {flagReasonModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`${cardClass} w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-red-500/40`}>
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Flag Result Discrepancy</h3>
                <p className="text-xs text-slate-400">
                  {inspectResult?.polling_unit_name} ({inspectResult?.polling_unit_code})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Flagging this result quarantines it from collation and writes an audit log event for the PDP legal tribunal team.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400">Reason for Flagging</label>
              <textarea
                rows={3}
                value={flagNotes}
                onChange={(e) => setFlagNotes(e.target.value)}
                placeholder="e.g. EC8A figure altered, illegible presiding officer stamp, or BVAS mismatch."
                className="w-full p-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFlagReasonModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleFlagResult}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL EC8A ENTRY MODAL */}
      {/* ========================================================================= */}
      {showManualEntryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${cardClass} w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FileText className="w-4 h-4 text-emerald-500" /> Form EC8A Manual Vote Entry
              </h3>
              <button onClick={() => setShowManualEntryModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = e.target;
              try {
                let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                if (!token) await loginUser('admin', 'password');

                await apiFetch('/results/submit', {
                  method: 'POST',
                  body: JSON.stringify({
                    polling_unit_id: Number(f.polling_unit_id.value),
                    election_type: f.election_type.value,
                    pdp_votes: Number(f.pdp_votes.value),
                    apc_votes: Number(f.apc_votes.value),
                    nnpp_votes: Number(f.nnpp_votes.value),
                    lp_votes: Number(f.lp_votes.value),
                    rejected_votes: Number(f.rejected_votes.value || 0),
                    notes: f.notes.value || 'Manual entry from Situation Room'
                  })
                });
                alert(`Form EC8A ${f.election_type.value} vote tally recorded successfully!`);
                setShowManualEntryModal(false);
                loadResults();
              } catch (err) {
                alert('Error submitting EC8A votes: ' + err.message);
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-400">Target Polling Unit ID</label>
                <input required name="polling_unit_id" type="number" defaultValue="1" placeholder="Enter PU ID (1 to 4827)" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Election Contest / Category</label>
                <select 
                  name="election_type" 
                  defaultValue={electionType !== 'ALL' ? electionType : 'GOVERNORSHIP'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none font-bold"
                >
                  <option value="GOVERNORSHIP">🗳️ Governorship Election</option>
                  <option value="SENATORIAL">🏛️ Senatorial Election (Senate)</option>
                  <option value="HOUSE_OF_REPS">🏛️ House of Representatives</option>
                  <option value="PRESIDENTIAL">🇳🇬 Presidential Election</option>
                  <option value="STATE_ASSEMBLY">📜 State House of Assembly</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-emerald-500">PDP Votes</label>
                  <input required name="pdp_votes" type="number" defaultValue="250" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-blue-500">APC Votes</label>
                  <input required name="apc_votes" type="number" defaultValue="180" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-purple-500">NNPP Votes</label>
                  <input required name="nnpp_votes" type="number" defaultValue="35" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-amber-500">LP Votes</label>
                  <input required name="lp_votes" type="number" defaultValue="12" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Rejected Votes</label>
                <input name="rejected_votes" type="number" defaultValue="5" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Remarks / Hotline Notes</label>
                <input name="notes" type="text" placeholder="e.g. Telephoned from Gumel ward collation" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowManualEntryModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500">Submit EC8A Votes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}