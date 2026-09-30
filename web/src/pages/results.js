
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import {
  BarChart3,
  CheckCircle2,
  FileText,
  Download,
  Search,
  ShieldAlert,
  Eye,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  TableProperties,
  Vote,
  RefreshCw,
  TrendingUp,
  Users,
  Filter,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const CONTESTS = [
  { id: 'GOVERNORSHIP', label: 'Governorship' },
  { id: 'SENATORIAL', label: 'Senatorial' },
  { id: 'HOUSE_OF_REPS', label: 'House of Representatives' },
  { id: 'STATE_ASSEMBLY', label: 'State House of Assembly' },
]

const PALETTE = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EC4899', '#06B6D4', '#F97316', '#84CC16',
  '#A855F7', '#64748B',
]

const numberValue = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const formatNumber = (value) => numberValue(value).toLocaleString()

const getStatus = (result) =>
  String(result?.verification_status || 'PENDING_REVIEW').toUpperCase()

const getCandidateEntries = (result) => {
  if (Array.isArray(result?.candidates)) {
    return result.candidates.map((candidate, index) => ({
      candidate_id: candidate.candidate_id ?? candidate.id ?? index,
      candidate_name:
        candidate.candidate_name ??
        candidate.name ??
        candidate.full_name ??
        'Unnamed candidate',
      party_name:
        candidate.party_name ??
        candidate.party ??
        candidate.party_abbreviation ??
        'Unknown party',
      votes: numberValue(candidate.votes ?? candidate.vote_count),
    }))
  }

  const voteObject =
    result?.candidate_votes ??
    result?.votes_by_candidate ??
    result?.candidate_results

  if (voteObject && !Array.isArray(voteObject) && typeof voteObject === 'object') {
    return Object.entries(voteObject).map(([key, value], index) => {
      if (typeof value === 'number' || typeof value === 'string') {
        return {
          candidate_id: key,
          candidate_name: key,
          party_name: 'Unknown party',
          votes: numberValue(value),
        }
      }

      return {
        candidate_id: value?.candidate_id ?? value?.id ?? key ?? index,
        candidate_name:
          value?.candidate_name ?? value?.name ?? value?.full_name ?? key,
        party_name:
          value?.party_name ??
          value?.party ??
          value?.party_abbreviation ??
          'Unknown party',
        votes: numberValue(value?.votes ?? value?.vote_count),
      }
    })
  }

  return []
}

const getContestLabel = (value) =>
  CONTESTS.find((item) => item.id === value)?.label ||
  String(value || 'Unspecified contest').replaceAll('_', ' ')

export default function ResultsDashboardPage({
  contest = null,
  lockedContest = false,
  title = null,
}) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState('analysis')
  const [electionType, setElectionType] = useState(contest || 'GOVERNORSHIP')
  const [selectedLgaId, setSelectedLgaId] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lgas, setLgas] = useState([])
  const [summaryData, setSummaryData] = useState(null)
  const [partyVoteShare, setPartyVoteShare] = useState([])
  const [lgaBreakdown, setLgaBreakdown] = useState([])
  const [results, setResults] = useState([])
  const [totalResults, setTotalResults] = useState(0)

  const [inspectResult, setInspectResult] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [flagModalOpen, setFlagModalOpen] = useState(false)
  const [flagNotes, setFlagNotes] = useState('')
  const [actionMessage, setActionMessage] = useState(null)

  useEffect(() => {
    if (!router.isReady) return

    if (lockedContest && contest) {
      setElectionType(contest.toUpperCase())
    } else if (router.query.election_type) {
      setElectionType(String(router.query.election_type).toUpperCase())
    }
  }, [router.isReady, router.query.election_type, lockedContest, contest])

  useEffect(() => {
    let mounted = true

    apiFetch('/electoral/lgas')
      .then((data) => {
        if (!mounted) return
        const list = Array.isArray(data)
          ? data
          : data?.lgas || data?.items || []
        setLgas(Array.isArray(list) ? list : [])
      })
      .catch((err) => console.warn('Unable to load LGAs:', err))

    return () => {
      mounted = false
    }
  }, [])

  const loadResults = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('limit', String(pageSize))
      params.set('skip', String(page * pageSize))

      if (selectedLgaId) params.set('lga_id', selectedLgaId)
      if (electionType && electionType !== 'ALL') {
        params.set('election_type', electionType)
      }
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const data = await apiFetch(`/results?${params.toString()}`)
      const rows = Array.isArray(data)
        ? data
        : data?.results || data?.items || []

      setResults(Array.isArray(rows) ? rows : [])
      setTotalResults(
        numberValue(
          data?.total_results ??
          data?.total ??
          (Array.isArray(rows) ? rows.length : 0)
        )
      )
      setSummaryData(data?.summary || null)
      setPartyVoteShare(
        Array.isArray(data?.party_vote_share) ? data.party_vote_share : []
      )
      setLgaBreakdown(
        Array.isArray(data?.lga_breakdown) ? data.lga_breakdown : []
      )
    } catch (err) {
      setError(err?.message || 'Unable to load results.')
      setResults([])
      setTotalResults(0)
      setSummaryData(null)
      setPartyVoteShare([])
      setLgaBreakdown([])
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, selectedLgaId, electionType, statusFilter, searchQuery])

  useEffect(() => {
    loadResults()
  }, [loadResults])

  const allCandidates = useMemo(() => {
    const totals = new Map()

    results.forEach((result) => {
      getCandidateEntries(result).forEach((candidate) => {
        const key = `${candidate.candidate_id}|${candidate.candidate_name}|${candidate.party_name}`
        const current = totals.get(key) || {
          ...candidate,
          votes: 0,
        }
        current.votes += numberValue(candidate.votes)
        totals.set(key, current)
      })
    })

    return [...totals.values()].sort((a, b) => b.votes - a.votes)
  }, [results])

  const candidateTotals = useMemo(() => {
    const totals = new Map()

    results.forEach((result) => {
      getCandidateEntries(result).forEach((candidate) => {
        const key = `${candidate.candidate_id}|${candidate.candidate_name}|${candidate.party_name}`
        totals.set(key, (totals.get(key) || 0) + numberValue(candidate.votes))
      })
    })

    return [...totals.entries()]
      .map(([key, votes]) => {
        const [candidate_id, candidate_name, party_name] = key.split('|')
        return { candidate_id, candidate_name, party_name, votes }
      })
      .sort((a, b) => b.votes - a.votes)
  }, [results])

  const partyTotals = useMemo(() => {
    const totals = new Map()

    results.forEach((result) => {
      getCandidateEntries(result).forEach((candidate) => {
        const party = candidate.party_name || 'Unknown party'
        totals.set(party, (totals.get(party) || 0) + numberValue(candidate.votes))
      })
    })

    return [...totals.entries()]
      .map(([party, votes], index) => ({
        party,
        votes,
        color: PALETTE[index % PALETTE.length],
      }))
      .sort((a, b) => b.votes - a.votes)
  }, [results])

  const totalCandidateVotes = candidateTotals.reduce(
    (sum, candidate) => sum + candidate.votes,
    0
  )

  const leadingCandidate = candidateTotals[0] || null
  const runnerUp = candidateTotals[1] || null
  const leadMargin = leadingCandidate
    ? leadingCandidate.votes - (runnerUp?.votes || 0)
    : null

  const statusCounts = useMemo(() => {
    return results.reduce(
      (counts, result) => {
        const status = getStatus(result)
        counts[status] = (counts[status] || 0) + 1
        if (result.is_overvote) counts.OVER_VOTE = (counts.OVER_VOTE || 0) + 1
        return counts
      },
      {}
    )
  }, [results])

  const flaggedCount =
    (statusCounts.FLAGGED || 0) + (statusCounts.OVER_VOTE || 0)

  const cardClass = isDark
    ? 'bg-[#141E38] border border-slate-800'
    : 'bg-white border border-slate-200 shadow-sm'

  const textMain = isDark ? 'text-white' : 'text-slate-900'
  const muted = 'text-slate-400'
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize))

  const handleApprove = async (result) => {
    if (!result?.id) return
    setActionLoading(true)
    setActionMessage(null)

    try {
      await apiFetch(`/results/approve/${result.id}`, { method: 'POST' })
      setActionMessage({
        type: 'success',
        text: `Approval request for result #${result.id} was accepted.`,
      })
      await loadResults()
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: `Approval failed: ${err?.message || 'Unknown error'}`,
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleFlag = async () => {
    if (!inspectResult?.id || !flagNotes.trim()) return
    setActionLoading(true)
    setActionMessage(null)

    try {
      const notes = encodeURIComponent(flagNotes.trim())
      await apiFetch(`/results/flag/${inspectResult.id}?notes=${notes}`, {
        method: 'POST',
      })
      setActionMessage({
        type: 'success',
        text: `Flag request for result #${inspectResult.id} was accepted.`,
      })
      setFlagModalOpen(false)
      setFlagNotes('')
      await loadResults()
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: `Flagging failed: ${err?.message || 'Unknown error'}`,
      })
    } finally {
      setActionLoading(false)
    }
  }

  const csvCell = (value) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`

  const exportCsv = () => {
    if (!results.length) {
      alert('There are no results on this page to export.')
      return
    }

    const headers = [
      'Polling Unit Code',
      'Polling Unit Name',
      'Contest',
      'LGA',
      'Registered Voters',
      'Candidate',
      'Party',
      'Votes',
      'Rejected Votes',
      'Total Votes Cast',
      'Status',
      'EC8A Photo URL',
    ]

    const rows = results.flatMap((result) => {
      const candidates = getCandidateEntries(result)
      const base = [
        result.polling_unit_code,
        result.polling_unit_name,
        result.election_type,
        result.lga_name || result.lga,
        result.registered_voters,
      ]

      if (!candidates.length) {
        return [[
          ...base,
          '',
          '',
          '',
          result.rejected_votes,
          result.total_votes_cast,
          getStatus(result),
          result.ec8a_photo_url,
        ]]
      }

      return candidates.map((candidate) => [
        ...base,
        candidate.candidate_name,
        candidate.party_name,
        candidate.votes,
        result.rejected_votes,
        result.total_votes_cast,
        getStatus(result),
        result.ec8a_photo_url,
      ])
    })

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pollwatch_results_${electionType}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setSelectedLgaId('')
    setStatusFilter('ALL')
    setSearchQuery('')
    setPage(0)
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title={title || 'Election Results Dashboard'}
          subtitle="Candidate results, contest-level collation, and data analysis"
        />

        <main className="p-4 md:p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex flex-wrap items-center justify-between gap-3 text-sm text-red-400">
              <span>Unable to load live results: {error}</span>
              <button
                onClick={loadResults}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-1.5 font-bold"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          <section className={`${cardClass} rounded-2xl p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-500">
                  <Vote className="mr-1 inline w-4 h-4" />
                  Election contest
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(lockedContest
                  ? CONTESTS.filter((item) => item.id === contest)
                  : CONTESTS
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setElectionType(item.id)
                      setPage(0)
                    }}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      electionType === item.id
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : isDark
                          ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                {!lockedContest && (
                  <button
                    onClick={() => {
                      setElectionType('ALL')
                      setPage(0)
                    }}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                      electionType === 'ALL'
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : isDark
                          ? 'border-slate-700 bg-slate-900 text-slate-300'
                          : 'border-slate-300 bg-slate-50 text-slate-600'
                    }`}
                  >
                    All contests
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={`${cardClass} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold ${muted}`}>Results received</p>
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <p className={`mt-2 text-2xl font-extrabold ${textMain}`}>
                {loading ? '—' : formatNumber(summaryData?.collated_pus ?? totalResults)}
              </p>
              <p className={`mt-1 text-[11px] ${muted}`}>For the selected contest and filters</p>
            </div>

            <div className={`${cardClass} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold ${muted}`}>Votes in loaded results</p>
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <p className={`mt-2 text-2xl font-extrabold ${textMain}`}>
                {loading ? '—' : formatNumber(summaryData?.total_votes ?? totalCandidateVotes)}
              </p>
              <p className={`mt-1 text-[11px] ${muted}`}>Based on available backend data</p>
            </div>

            <div className={`${cardClass} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold ${muted}`}>Leading candidate</p>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className={`mt-2 truncate text-lg font-extrabold ${textMain}`}>
                {loading ? '—' : leadingCandidate?.candidate_name || 'No candidate data'}
              </p>
              <p className={`mt-1 text-[11px] ${muted}`}>
                {leadingCandidate
                  ? `${leadingCandidate.party_name} · ${formatNumber(leadingCandidate.votes)} votes`
                  : 'Leader appears when candidate votes are available'}
              </p>
            </div>

            <div className={`${cardClass} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold ${muted}`}>Lead margin</p>
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <p className={`mt-2 text-2xl font-extrabold ${textMain}`}>
                {loading || leadMargin === null ? '—' : formatNumber(leadMargin)}
              </p>
              <p className={`mt-1 text-[11px] ${muted}`}>Difference from the next candidate in loaded results</p>
            </div>
          </section>

          <section className={`${cardClass} rounded-2xl p-4 md:p-5 space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className={`text-sm font-extrabold ${textMain}`}>Data analysis</h2>
                <p className={`mt-1 text-xs ${muted}`}>
                  Candidate and party totals from the results currently returned by the backend.
                </p>
              </div>
              <button
                onClick={loadResults}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                <span className="text-xs font-bold">Loading election analysis...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="min-w-0">
                  <h3 className={`mb-3 text-xs font-bold ${textMain}`}>Candidate vote comparison</h3>
                  {candidateTotals.length ? (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={candidateTotals} margin={{ top: 8, right: 12, left: 0, bottom: 48 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                          <XAxis
                            dataKey="candidate_name"
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                            height={70}
                            tick={{ fontSize: 10, fill: isDark ? '#cbd5e1' : '#475569' }}
                          />
                          <YAxis tick={{ fontSize: 10, fill: isDark ? '#cbd5e1' : '#475569' }} />
                          <Tooltip />
                          <Bar dataKey="votes" name="Votes" fill="#10B981" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className={`flex h-56 items-center justify-center rounded-xl border border-dashed ${isDark ? 'border-slate-700' : 'border-slate-300'} text-center text-xs ${muted}`}>
                      Candidate vote data is not available yet.
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className={`mb-3 text-xs font-bold ${textMain}`}>Party vote distribution</h3>
                  {partyTotals.length ? (
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                      <div className="h-64 w-full sm:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={partyTotals}
                              dataKey="votes"
                              nameKey="party"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={2}
                            >
                              {partyTotals.map((party, index) => (
                                <Cell key={`${party.party}-${index}`} fill={party.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full space-y-2 sm:w-1/2">
                        {partyTotals.map((party) => (
                          <div key={party.party} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/50 p-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: party.color }} />
                              <span className={`truncate text-xs font-bold ${textMain}`}>{party.party}</span>
                            </div>
                            <span className={`text-xs font-mono font-bold ${muted}`}>
                              {formatNumber(party.votes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex h-56 items-center justify-center rounded-xl border border-dashed ${isDark ? 'border-slate-700' : 'border-slate-300'} text-center text-xs ${muted}`}>
                      Party vote data is not available yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Verified', statusCounts.VERIFIED || 0, 'text-emerald-500'],
                ['Pending review', statusCounts.PENDING_REVIEW || 0, 'text-blue-500'],
                ['Flagged', statusCounts.FLAGGED || 0, 'text-red-500'],
                ['Over-vote marked', statusCounts.OVER_VOTE || 0, 'text-amber-500'],
              ].map(([label, value, color]) => (
                <div key={label} className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-[11px] font-bold ${muted}`}>{label}</p>
                  <p className={`mt-1 text-xl font-extrabold ${color}`}>{formatNumber(value)}</p>
                </div>
              ))}
            </div>
            <p className={`text-[10px] ${muted}`}>
              Status counts above describe the loaded results page. They are not statewide totals unless all relevant records are returned.
            </p>
          </section>

          <section className={`${cardClass} rounded-xl p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${activeTab === 'analysis' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  <BarChart3 className="mr-1 inline h-4 w-4" /> Analysis
                </button>
                <button
                  onClick={() => setActiveTab('units')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${activeTab === 'units' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  <FileText className="mr-1 inline h-4 w-4" /> Polling unit results
                </button>
                <button
                  onClick={() => setActiveTab('lgas')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${activeTab === 'lgas' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  <TableProperties className="mr-1 inline h-4 w-4" /> LGA breakdown
                </button>
              </div>

              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                Export current page CSV
              </button>
            </div>
          </section>

          {activeTab === 'analysis' && (
            <section className={`${cardClass} rounded-xl p-4 space-y-3`}>
              <h2 className={`text-sm font-extrabold ${textMain}`}>Candidate summary</h2>
              {candidateTotals.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-xs">
                    <thead>
                      <tr className={`${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <th className="p-3">Position</th>
                        <th className="p-3">Candidate</th>
                        <th className="p-3">Party</th>
                        <th className="p-3 text-right">Votes</th>
                        <th className="p-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidateTotals.map((candidate, index) => (
                        <tr key={`${candidate.candidate_id}-${index}`} className="border-b border-slate-700/40">
                          <td className="p-3">{index === 0 ? 'Leading in loaded data' : index === 1 ? 'Next candidate' : 'Candidate'}</td>
                          <td className={`p-3 font-bold ${textMain}`}>{candidate.candidate_name}</td>
                          <td className="p-3">{candidate.party_name}</td>
                          <td className="p-3 text-right font-mono">{formatNumber(candidate.votes)}</td>
                          <td className="p-3 text-right font-mono">
                            {totalCandidateVotes
                              ? `${((candidate.votes / totalCandidateVotes) * 100).toFixed(2)}%`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={`py-10 text-center text-xs ${muted}`}>
                  Candidate-level analysis will appear when candidate votes are included in the results data.
                </p>
              )}
            </section>
          )}

          {activeTab === 'units' && (
            <section className={`${cardClass} rounded-xl p-4 space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className={`text-sm font-extrabold ${textMain}`}>Polling unit results</h2>
                  <p className={`mt-1 text-xs ${muted}`}>
                    Inspect submitted results and their EC8A evidence.
                  </p>
                </div>
                <span className={`text-xs ${muted}`}>
                  Showing {results.length} of {formatNumber(totalResults)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedLgaId}
                  onChange={(event) => {
                    setSelectedLgaId(event.target.value)
                    setPage(0)
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-800'}`}
                >
                  <option value="">All LGAs</option>
                  {lgas.map((lga) => (
                    <option key={lga.id} value={lga.id}>{lga.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value)
                    setPage(0)
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-800'}`}
                >
                  <option value="ALL">All statuses</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING_REVIEW">Pending review</option>
                  <option value="FLAGGED">Flagged</option>
                  <option value="PENDING_PHOTO">Pending photo</option>
                </select>

                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      setPage(0)
                    }}
                    placeholder="Search polling unit..."
                    className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs outline-none ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-800'}`}
                  />
                </div>

                <button onClick={resetFilters} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white">
                  <Filter className="mr-1 inline h-4 w-4" /> Clear filters
                </button>
              </div>

              {loading ? (
                <div className="flex min-h-40 items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> Loading results...
                </div>
              ) : results.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-xs">
                    <thead>
                      <tr className={`${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <th className="p-3">PU code</th>
                        <th className="p-3">Polling unit</th>
                        <th className="p-3">Contest</th>
                        <th className="p-3 text-right">Registered voters</th>
                        <th className="p-3 text-right">Total votes</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => {
                        const status = getStatus(result)
                        const flagged = status === 'FLAGGED' || result.is_overvote
                        return (
                          <tr key={result.id} className={`border-b ${isDark ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <td className="p-3 font-mono">{result.polling_unit_code || '—'}</td>
                            <td className={`p-3 font-semibold ${textMain}`}>
                              {result.polling_unit_name || 'Unnamed polling unit'}
                              <div className={`mt-1 text-[10px] font-normal ${muted}`}>{result.agent_name || 'Agent not specified'}</div>
                            </td>
                            <td className="p-3">{getContestLabel(result.election_type)}</td>
                            <td className="p-3 text-right font-mono">{formatNumber(result.registered_voters)}</td>
                            <td className="p-3 text-right font-mono">{formatNumber(result.total_votes_cast)}</td>
                            <td className="p-3">
                              <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${
                                flagged
                                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                  : status === 'VERIFIED'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                              }`}>
                                {flagged ? 'FLAGGED' : status.replaceAll('_', ' ')}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setInspectResult(result)
                                  setActionMessage(null)
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 font-bold text-slate-200 hover:bg-emerald-600"
                              >
                                <Eye className="h-3.5 w-3.5" /> Inspect
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`py-12 text-center text-xs ${muted}`}>
                  No results found for the selected filters.
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-700/50 pt-3 text-xs">
                <span className={muted}>Page {page + 1} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0 || loading}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    className="rounded-lg bg-slate-800 p-2 text-slate-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg bg-slate-800 p-2 text-slate-300 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'lgas' && (
            <section className={`${cardClass} rounded-xl p-4 space-y-3`}>
              <h2 className={`text-sm font-extrabold ${textMain}`}>LGA breakdown</h2>
              {lgaBreakdown.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-xs">
                    <thead>
                      <tr className={`${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <th className="p-3">LGA</th>
                        <th className="p-3 text-right">Results received</th>
                        <th className="p-3 text-right">Total votes</th>
                        <th className="p-3">Leading candidate / party</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lgaBreakdown.map((lga, index) => (
                        <tr key={lga.lga_id ?? lga.id ?? lga.lga ?? index} className="border-b border-slate-700/40">
                          <td className={`p-3 font-bold ${textMain}`}>{lga.lga_name || lga.lga || lga.name || 'Unnamed LGA'}</td>
                          <td className="p-3 text-right font-mono">{formatNumber(lga.collated_pus ?? lga.collatedPus ?? lga.results_received)}</td>
                          <td className="p-3 text-right font-mono">{formatNumber(lga.total_votes ?? lga.totalVotes)}</td>
                          <td className="p-3">{lga.leading_candidate || lga.leading_party || 'Not available'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={`py-12 text-center text-xs ${muted}`}>
                  LGA breakdown is not available in the backend response yet.
                </p>
              )}
            </section>
          )}
        </main>
      </div>

      {inspectResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
          <div className={`${cardClass} flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl shadow-2xl`}>
            <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/80 p-4">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold text-white">
                  {inspectResult.polling_unit_name || 'Polling unit result'}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {inspectResult.polling_unit_code || 'No PU code'} · {getContestLabel(inspectResult.election_type)}
                </p>
              </div>
              <button onClick={() => setInspectResult(null)} className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">EC8A evidence</h3>
                <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-2">
                  {inspectResult.ec8a_photo_url ? (
                    <a href={inspectResult.ec8a_photo_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={inspectResult.ec8a_photo_url}
                        alt="EC8A result sheet"
                        className="max-h-[420px] rounded-lg object-contain"
                      />
                    </a>
                  ) : (
                    <div className="px-5 text-center text-xs text-slate-400">
                      <FileText className="mx-auto mb-2 h-9 w-9 text-slate-600" />
                      No EC8A photo has been attached to this result.
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-slate-700/60 p-3 text-xs text-slate-400">
                  <p>Agent: {inspectResult.agent_name || 'Not specified'}</p>
                  <p className="mt-1">Submitted: {inspectResult.created_at ? new Date(inspectResult.created_at).toLocaleString() : 'Not available'}</p>
                  <p className="mt-1">Status: {getStatus(inspectResult).replaceAll('_', ' ')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {actionMessage && (
                  <div className={`rounded-xl border p-3 text-xs ${
                    actionMessage.type === 'error'
                      ? 'border-red-500/30 bg-red-500/10 text-red-400'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {actionMessage.text}
                  </div>
                )}

                <div className="rounded-xl border border-slate-700 p-3">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Candidate vote tally</h3>
                  {getCandidateEntries(inspectResult).length ? (
                    <div className="space-y-2">
                      {getCandidateEntries(inspectResult).map((candidate, index) => (
                        <div key={`${candidate.candidate_id}-${index}`} className="flex items-center justify-between gap-3 border-b border-slate-700/50 pb-2 text-xs">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-200">{candidate.candidate_name}</p>
                            <p className="text-[10px] text-slate-400">{candidate.party_name}</p>
                          </div>
                          <strong className="font-mono text-sm text-white">{formatNumber(candidate.votes)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-5 text-center text-xs text-slate-400">
                      Candidate votes are not included in this result record.
                    </p>
                  )}
                  <div className="mt-3 space-y-1 border-t border-slate-700 pt-3 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Registered voters</span>
                      <strong>{formatNumber(inspectResult.registered_voters)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Rejected votes</span>
                      <strong>{formatNumber(inspectResult.rejected_votes)}</strong>
                    </div>
                    <div className="flex justify-between font-bold text-white">
                      <span>Total votes cast</span>
                      <strong>{formatNumber(inspectResult.total_votes_cast)}</strong>
                    </div>
                  </div>
                </div>

                {(inspectResult.is_overvote || getStatus(inspectResult) === 'FLAGGED') && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    <ShieldAlert className="mr-2 inline h-4 w-4" />
                    This result is marked as flagged or over-voted. Review it before taking further action.
                  </div>
                )}

                {inspectResult.notes && (
                  <div className="rounded-xl border border-slate-700/60 p-3 text-xs">
                    <p className="mb-1 font-bold text-slate-400">Agent remarks</p>
                    <p className="whitespace-pre-wrap text-slate-300">{inspectResult.notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={
                      actionLoading ||
                      inspectResult.is_overvote ||
                      getStatus(inspectResult) === 'FLAGGED' ||
                      getStatus(inspectResult) === 'VERIFIED' ||
                      !inspectResult.ec8a_photo_url
                    }
                    onClick={() => handleApprove(inspectResult)}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 inline h-4 w-4" />
                    )}
                    {getStatus(inspectResult) === 'VERIFIED'
                      ? 'Already verified'
                      : !inspectResult.ec8a_photo_url
                        ? 'EC8A photo required'
                        : 'Verify result'}
                  </button>
                  <button
                    disabled={actionLoading || getStatus(inspectResult) === 'FLAGGED'}
                    onClick={() => setFlagModalOpen(true)}
                    className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-40"
                  >
                    <AlertTriangle className="mr-1 inline h-4 w-4" /> Flag
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-700 bg-slate-900/80 p-3">
              <button onClick={() => setInspectResult(null)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {flagModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className={`${cardClass} w-full max-w-md space-y-4 rounded-2xl p-5`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white">Flag result for review</h2>
              <button onClick={() => setFlagModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Enter a reason so the review team can understand why this result was flagged.
            </p>
            <textarea
              value={flagNotes}
              onChange={(event) => setFlagNotes(event.target.value)}
              rows={4}
              placeholder="Describe the discrepancy..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200 outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setFlagModalOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !flagNotes.trim()}
                onClick={handleFlag}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {actionLoading ? 'Submitting...' : 'Confirm flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}