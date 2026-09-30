import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import {
  Building2,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  ShieldCheck,
  Loader2,
  Check,
  ArrowRight,
  Download,
  Users,
  RefreshCw,
  MapPin,
  Trophy,
} from 'lucide-react'

const number = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatNumber = (value) => number(value).toLocaleString()

const getArray = (value, keys = []) => {
  if (Array.isArray(value)) return value
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key]
  }
  return []
}

const getCandidateName = (candidate) =>
  candidate?.candidate_name ||
  candidate?.name ||
  candidate?.full_name ||
  candidate?.candidate?.name ||
  'Unnamed candidate'

const getPartyName = (candidate) =>
  candidate?.party_name ||
  candidate?.party ||
  candidate?.party?.name ||
  candidate?.party?.acronym ||
  'Party not provided'

const getCandidateVotes = (candidate) =>
  number(
    candidate?.votes ??
    candidate?.total_votes ??
    candidate?.vote_count ??
    candidate?.votes_received
  )

const getCandidates = (source) => {
  const candidates = getArray(source, [
    'candidates',
    'candidate_results',
    'candidate_votes',
    'contestants',
  ])

  return candidates
    .map((candidate, index) => ({
      id: candidate?.candidate_id ?? candidate?.id ?? index,
      name: getCandidateName(candidate),
      party: getPartyName(candidate),
      votes: getCandidateVotes(candidate),
      raw: candidate,
    }))
    .filter((candidate) => candidate.name !== 'Unnamed candidate' || candidate.votes > 0)
    .sort((a, b) => b.votes - a.votes)
}

const getStatus = (item, signoff) => {
  if (signoff?.status === 'SIGNED' || signoff?.is_signed) {
    return 'Signed Off'
  }

  const collated = number(item?.collated_pus ?? item?.collatedPus)
  const total = number(item?.total_pus ?? item?.totalPus)

  if (total > 0 && collated >= total) return 'Ready for Sign-off'
  if (collated > 0) return 'In Progress'
  return 'Pending'
}

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

export default function CollationCenterPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [selectedLgaFilter, setSelectedLgaFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [lgas, setLgas] = useState([])
  const [lgaBreakdown, setLgaBreakdown] = useState([])
  const [signoffs, setSignoffs] = useState([])
  const [summaryData, setSummaryData] = useState(null)

  const [inspectLgaId, setInspectLgaId] = useState(null)
  const [lgaDrilldownData, setLgaDrilldownData] = useState(null)
  const [loadingDrilldown, setLoadingDrilldown] = useState(false)
  const [drilldownError, setDrilldownError] = useState('')
  const [expandedWards, setExpandedWards] = useState({})

  const [showSignoffConfirm, setShowSignoffConfirm] = useState(false)
  const [signoffNotes, setSignoffNotes] = useState('')
  const [signingOff, setSigningOff] = useState(false)
  const [signoffSuccessMsg, setSignoffSuccessMsg] = useState('')
  const [signoffError, setSignoffError] = useState('')
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null)

  const cardClass = isDark
    ? 'bg-[#141E38] border border-slate-800'
    : 'bg-white border border-slate-200 shadow-sm'

  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputClass = `rounded-lg border px-3 py-2 text-xs outline-none ${
    isDark
      ? 'bg-slate-900 border-slate-700 text-slate-200'
      : 'bg-white border-slate-300 text-slate-900'
  }`

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    const [resultsRes, lgasRes, signoffsRes] = await Promise.allSettled([
      apiFetch('/results'),
      apiFetch('/electoral/lgas'),
      apiFetch('/collation/signoffs?level=LGA'),
    ])

    if (resultsRes.status === 'fulfilled') {
      const response = resultsRes.value || {}
      setLgaBreakdown(
        getArray(response, ['lga_breakdown', 'lgas', 'items'])
      )
      setSummaryData(response.summary || null)
    } else {
      setLoadError(resultsRes.reason?.message || 'Could not load collation results.')
    }

    if (lgasRes.status === 'fulfilled') {
      setLgas(getArray(lgasRes.value, ['lgas', 'items']))
    }

    if (signoffsRes.status === 'fulfilled') {
      setSignoffs(getArray(signoffsRes.value, ['signoffs', 'items']))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const signoffMap = useMemo(() => {
    const map = {}
    signoffs.forEach((signoff) => {
      if (signoff?.level === 'LGA' && signoff?.entity_id != null) {
        map[String(signoff.entity_id)] = signoff
      }
    })
    return map
  }, [signoffs])

  const mergedLgaData = useMemo(() => {
    const source = lgaBreakdown.length
      ? lgaBreakdown
      : lgas.map((lga) => ({
          id: lga.id,
          lga: lga.name,
          name: lga.name,
          total_pus: lga.total_polling_units || 0,
          collated_pus: 0,
        }))

    return source.map((item, index) => {
      const id = item.id ?? item.lga_id ?? null
      const name = item.lga || item.lga_name || item.name || 'Unnamed LGA'
      const signoff = id == null ? null : signoffMap[String(id)]
      const totalPus = number(item.total_pus ?? item.totalPus)
      const collatedPus = number(item.collated_pus ?? item.collatedPus)
      const pctValue = Number(item.pct ?? item.collation_percentage)
      const pct = Number.isFinite(pctValue)
        ? Math.max(0, Math.min(100, pctValue))
        : totalPus > 0
          ? Math.round((collatedPus / totalPus) * 100)
          : 0

      const candidates = getCandidates(item)
      const totalVotes = number(item.total_votes) ||
        candidates.reduce((sum, candidate) => sum + candidate.votes, 0)

      return {
        id: id ?? `lga-${index}`,
        name,
        totalPus,
        collatedPus,
        pct,
        candidates,
        totalVotes,
        signoff,
        status: getStatus(item, signoff),
        raw: item,
      }
    })
  }, [lgaBreakdown, lgas, signoffMap])

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return mergedLgaData.filter((item) => {
      const matchesLga =
        selectedLgaFilter === 'All' || item.name === selectedLgaFilter

      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.candidates.some(
          (candidate) =>
            candidate.name.toLowerCase().includes(query) ||
            candidate.party.toLowerCase().includes(query)
        )

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Signed' && item.status === 'Signed Off') ||
        (statusFilter === 'Ready' && item.status === 'Ready for Sign-off') ||
        (statusFilter === 'Pending' && item.status === 'Pending') ||
        (statusFilter === 'Progress' && item.status === 'In Progress')

      return matchesLga && matchesSearch && matchesStatus
    })
  }, [mergedLgaData, selectedLgaFilter, searchQuery, statusFilter])

  const activeCount = mergedLgaData.filter((item) => item.collatedPus > 0).length
  const signedOffCount = mergedLgaData.filter(
    (item) => item.status === 'Signed Off'
  ).length
  const totalPus = number(
    summaryData?.total_pus ?? summaryData?.total_ec8a
  ) || mergedLgaData.reduce((sum, item) => sum + item.totalPus, 0)
  const collatedPus = number(
    summaryData?.collated_pus
  ) || mergedLgaData.reduce((sum, item) => sum + item.collatedPus, 0)

  const handleOpenDrilldown = async (item) => {
    let lgaId = item.raw?.id ?? item.raw?.lga_id ?? item.id

    if (String(lgaId).startsWith('lga-')) {
      const match = lgas.find(
        (lga) => lga.name?.toLowerCase() === item.name.toLowerCase()
      )
      lgaId = match?.id
    }

    if (lgaId == null) {
      setDrilldownError(`No LGA ID is available for ${item.name}.`)
      setInspectLgaId('unavailable')
      setLgaDrilldownData(null)
      return
    }

    setInspectLgaId(lgaId)
    setLgaDrilldownData(null)
    setDrilldownError('')
    setLoadingDrilldown(true)
    setExpandedWards({})
    setSignoffSuccessMsg('')
    setSignoffError('')

    try {
      const data = await apiFetch(`/collation/lga/${lgaId}`)
      setLgaDrilldownData(data)

      const wards = getArray(data, ['wards'])
      if (wards.length > 0 && wards[0]?.id != null) {
        setExpandedWards({ [wards[0].id]: true })
      }
    } catch (error) {
      setDrilldownError(error.message || 'Failed to load this collation centre.')
    } finally {
      setLoadingDrilldown(false)
    }
  }

  const toggleWard = (wardId) => {
    setExpandedWards((previous) => ({
      ...previous,
      [wardId]: !previous[wardId],
    }))
  }

  const handleSignoffSubmit = async () => {
    if (inspectLgaId == null || inspectLgaId === 'unavailable') return

    setSigningOff(true)
    setSignoffError('')
    setSignoffSuccessMsg('')

    try {
      const response = await apiFetch('/collation/signoff', {
        method: 'POST',
        body: JSON.stringify({
          level: 'LGA',
          entity_id: inspectLgaId,
          notes: signoffNotes.trim(),
          status: 'SIGNED',
        }),
      })

      setSignoffSuccessMsg(
        `Sign-off recorded${response?.entity_name ? ` for ${response.entity_name}` : ''}.`
      )
      setShowSignoffConfirm(false)
      setSignoffNotes('')

      const updated = await apiFetch(`/collation/lga/${inspectLgaId}`)
      setLgaDrilldownData(updated)
      await fetchAllData()
    } catch (error) {
      setSignoffError(error.message || 'Sign-off failed.')
    } finally {
      setSigningOff(false)
    }
  }

  const handleExportCsv = () => {
    if (!filteredData.length) {
      alert('There are no collation records to export.')
      return
    }

    const rows = [
      [
        'LGA',
        'Candidate',
        'Party',
        'Candidate Votes',
        'LGA Total Votes',
        'Collated Polling Units',
        'Total Polling Units',
        'Collation Percentage',
        'Collation Status',
      ],
    ]

    filteredData.forEach((item) => {
      if (item.candidates.length) {
        item.candidates.forEach((candidate) => {
          rows.push([
            item.name,
            candidate.name,
            candidate.party,
            candidate.votes,
            item.totalVotes,
            item.collatedPus,
            item.totalPus,
            `${item.pct}%`,
            item.status,
          ])
        })
      } else {
        rows.push([
          item.name,
          'Candidate data unavailable',
          '',
          '',
          item.totalVotes,
          item.collatedPus,
          item.totalPus,
          `${item.pct}%`,
          item.status,
        ])
      }
    })

    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `collation_centres_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const closeInspector = () => {
    if (signingOff) return
    setInspectLgaId(null)
    setLgaDrilldownData(null)
    setShowSignoffConfirm(false)
    setSignoffNotes('')
    setSignoffError('')
  }

  const renderCandidates = (candidates, compact = false) => {
    if (!candidates?.length) {
      return (
        <p className="text-xs text-slate-500 italic">
          Candidate information has not been provided by the backend.
        </p>
      )
    }

    const leaderVotes = candidates[0]?.votes

    return (
      <div className="space-y-2">
        {candidates.map((candidate, index) => (
          <div
            key={`${candidate.id}-${index}`}
            className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
              isDark
                ? 'border-slate-800 bg-slate-950/40'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold">
                  {candidate.name}
                </span>
                {index === 0 && candidate.votes > 0 && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-500">
                    Currently leading
                  </span>
                )}
              </div>
              <p className={`mt-1 text-[10px] ${mutedText}`}>
                {candidate.party}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-extrabold">
                {formatNumber(candidate.votes)}
              </p>
              {!compact && leaderVotes > 0 && (
                <p className={`text-[10px] ${mutedText}`}>
                  {((candidate.votes / candidates.reduce(
                    (sum, entry) => sum + entry.votes,
                    0
                  )) * 100).toFixed(1)}% of listed votes
                </p>
              )}
            </div>
          </div>
        ))}
        <p className="text-[10px] text-slate-500">
          Leadership is based only on the candidate totals currently supplied.
          It is not a declaration of an official result.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors ${
        isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Header
          title="Collation Centre"
          subtitle="LGA collation progress, candidate identification, result review and EC8C sign-off"
        />

        <main className="space-y-6 p-4 md:p-6">
          {loadError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-500">
              <span>{loadError}</span>
              <button
                onClick={fetchAllData}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 font-bold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'LGAs with received results',
                value: `${activeCount} / ${mergedLgaData.length}`,
                note: 'Based on available collation data',
                icon: Building2,
                color: 'text-emerald-500',
              },
              {
                label: 'Polling units collated',
                value: `${formatNumber(collatedPus)} / ${formatNumber(totalPus)}`,
                note: totalPus > 0
                  ? `${((collatedPus / totalPus) * 100).toFixed(1)}% of listed units`
                  : 'Polling-unit totals unavailable',
                icon: MapPin,
                color: 'text-blue-500',
              },
              {
                label: 'EC8C sign-offs',
                value: `${signedOffCount} / ${mergedLgaData.length}`,
                note: 'Recorded LGA sign-offs',
                icon: ShieldCheck,
                color: 'text-amber-500',
              },
              {
                label: 'Collation centres listed',
                value: formatNumber(mergedLgaData.length),
                note: 'LGA records returned by the backend',
                icon: Users,
                color: 'text-purple-500',
              },
            ].map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className={`${cardClass} flex items-center justify-between rounded-xl p-4`}
                >
                  <div>
                    <p className={`text-xs font-bold ${mutedText}`}>
                      {metric.label}
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold">
                      {metric.value}
                    </h3>
                    <p className={`mt-1 text-[10px] ${mutedText}`}>
                      {metric.note}
                    </p>
                  </div>
                  <div className={`rounded-xl bg-slate-500/10 p-3 ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              )
            })}
          </section>

          <section className={`${cardClass} rounded-xl p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedLgaFilter}
                  onChange={(event) => setSelectedLgaFilter(event.target.value)}
                  className={inputClass}
                >
                  <option value="All">All LGAs</option>
                  {lgas.map((lga) => (
                    <option key={lga.id} value={lga.name}>
                      {lga.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={inputClass}
                >
                  <option value="All">All statuses</option>
                  <option value="Signed">Signed off</option>
                  <option value="Ready">Ready for sign-off</option>
                  <option value="Progress">In progress</option>
                  <option value="Pending">Pending</option>
                </select>

                <button
                  onClick={fetchAllData}
                  disabled={loading}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search LGA or candidate..."
                    className={`${inputClass} w-64 pl-8`}
                  />
                </div>
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  Export CSV
                </button>
              </div>
            </div>
          </section>

          <section className={`${cardClass} overflow-hidden rounded-xl`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/20 p-5">
              <div>
                <h3 className="text-sm font-bold">
                  Collation Centres and Candidate Results
                </h3>
                <p className={`mt-1 text-[11px] ${mutedText}`}>
                  Select a centre to inspect its wards, polling units, candidates and available results.
                </p>
              </div>
              <span className={`text-xs ${mutedText}`}>
                Showing {filteredData.length} of {mergedLgaData.length} LGAs
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                Loading collation data...
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                No collation centres match the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className={isDark ? 'bg-slate-900/80 text-slate-400' : 'bg-slate-100 text-slate-500'}>
                      <th className="px-4 py-3">Collation centre / LGA</th>
                      <th className="px-4 py-3">Candidates identified</th>
                      <th className="px-4 py-3">Polling units</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3">EC8C status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {filteredData.map((item) => (
                      <tr
                        key={item.id}
                        className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 font-bold">
                            <Building2 className="h-4 w-4 text-emerald-500" />
                            {item.name}
                          </div>
                          <p className={`mt-1 pl-6 text-[10px] ${mutedText}`}>
                            LGA collation record
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {item.candidates.length ? (
                            <div className="space-y-1">
                              {item.candidates.slice(0, 3).map((candidate, index) => (
                                <div key={`${candidate.id}-${index}`} className="flex flex-wrap items-center gap-1">
                                  <span className="font-semibold">{candidate.name}</span>
                                  <span className={mutedText}>({candidate.party})</span>
                                  {index === 0 && candidate.votes > 0 && (
                                    <Trophy className="h-3 w-3 text-emerald-500" />
                                  )}
                                </div>
                              ))}
                              {item.candidates.length > 3 && (
                                <p className={`text-[10px] ${mutedText}`}>
                                  +{item.candidates.length - 3} more candidates
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] italic text-slate-500">
                              Awaiting candidate data
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-mono">
                          {formatNumber(item.collatedPus)} / {formatNumber(item.totalPus)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{item.pct}%</span>
                            <div className={`h-1.5 w-20 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${item.pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold ${
                            item.status === 'Signed Off'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : item.status === 'Ready for Sign-off'
                                ? 'bg-blue-500/15 text-blue-500'
                                : item.status === 'In Progress'
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-slate-500/15 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleOpenDrilldown(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 font-bold text-white hover:bg-emerald-600"
                          >
                            Inspect
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {inspectLgaId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm md:p-6">
          <div className={`${cardClass} flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl shadow-2xl`}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-700/30 p-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <Building2 className="h-5 w-5 text-emerald-500" />
                  {lgaDrilldownData?.lga?.name || 'Collation Centre'}
                </h2>
                <p className={`mt-1 text-xs ${mutedText}`}>
                  Candidate identification, ward breakdown and polling-unit results
                </p>
              </div>
              <button
                onClick={closeInspector}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close inspector"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
              {loadingDrilldown ? (
                <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  Loading centre details...
                </div>
              ) : drilldownError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
                  {drilldownError}
                  <button
                    onClick={() => {
                      const item = mergedLgaData.find(
                        (entry) => String(entry.id) === String(inspectLgaId)
                      )
                      if (item) handleOpenDrilldown(item)
                    }}
                    className="ml-3 font-bold underline"
                  >
                    Retry
                  </button>
                </div>
              ) : lgaDrilldownData ? (
                <>
                  {signoffSuccessMsg && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" />
                      {signoffSuccessMsg}
                    </div>
                  )}

                  {signoffError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
                      {signoffError}
                    </div>
                  )}

                  <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className={`${cardClass} rounded-xl p-4`}>
                      <p className={`text-[10px] font-bold ${mutedText}`}>Polling units collated</p>
                      <p className="mt-1 text-xl font-extrabold">
                        {formatNumber(lgaDrilldownData.lga?.collated_pus)} / {formatNumber(lgaDrilldownData.lga?.total_pus)}
                      </p>
                    </div>
                    <div className={`${cardClass} rounded-xl p-4`}>
                      <p className={`text-[10px] font-bold ${mutedText}`}>Total votes reported</p>
                      <p className="mt-1 text-xl font-extrabold">
                        {formatNumber(lgaDrilldownData.lga?.total_votes)}
                      </p>
                    </div>
                    <div className={`${cardClass} rounded-xl p-4`}>
                      <p className={`text-[10px] font-bold ${mutedText}`}>Flagged polling units</p>
                      <p className="mt-1 text-xl font-extrabold text-amber-500">
                        {formatNumber(lgaDrilldownData.lga?.flagged_count)}
                      </p>
                    </div>
                  </section>

                  <section className={`${cardClass} space-y-4 rounded-xl p-4`}>
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold">
                        <Users className="h-4 w-4 text-emerald-500" />
                        Candidates assigned to this centre
                      </h3>
                      <p className={`mt-1 text-[11px] ${mutedText}`}>
                        Candidate details and vote totals are shown when returned by the backend.
                      </p>
                    </div>
                    {renderCandidates(
                      getCandidates(lgaDrilldownData)
                        .length
                        ? getCandidates(lgaDrilldownData)
                        : getCandidates(lgaDrilldownData.lga)
                    )}
                  </section>

                  <section className={`${cardClass} rounded-xl p-4`}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold">Ward and polling-unit breakdown</h3>
                        <p className={`mt-1 text-[11px] ${mutedText}`}>
                          Expand a ward to inspect its polling units.
                        </p>
                      </div>
                      <span className={`text-xs ${mutedText}`}>
                        {getArray(lgaDrilldownData, ['wards']).length} wards
                      </span>
                    </div>

                    <div className="space-y-3">
                      {getArray(lgaDrilldownData, ['wards']).map((ward) => {
                        const expanded = Boolean(expandedWards[ward.id])
                        const pollingUnits = getArray(ward, ['polling_units', 'pollingUnits'])

                        return (
                          <div
                            key={ward.id}
                            className={`overflow-hidden rounded-xl border ${
                              isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200'
                            }`}
                          >
                            <button
                              onClick={() => toggleWard(ward.id)}
                              className="flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left hover:bg-slate-500/5"
                            >
                              <span className="flex items-center gap-2">
                                {expanded
                                  ? <ChevronDown className="h-4 w-4 text-emerald-500" />
                                  : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                <span className="text-xs font-bold">{ward.name || 'Unnamed ward'}</span>
                                {ward.code && (
                                  <span className="text-[10px] text-slate-500">{ward.code}</span>
                                )}
                              </span>
                              <span className={`text-[10px] ${mutedText}`}>
                                {formatNumber(ward.collated_pus)} / {formatNumber(ward.total_pus)} PUs
                              </span>
                            </button>

                            {expanded && (
                              <div className="overflow-x-auto border-t border-slate-700/20">
                                {pollingUnits.length === 0 ? (
                                  <p className="p-4 text-xs text-slate-500">
                                    No polling-unit records are available for this ward.
                                  </p>
                                ) : (
                                  <table className="w-full text-left text-[11px]">
                                    <thead className={isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'}>
                                      <tr>
                                        <th className="px-3 py-2">Polling unit</th>
                                        <th className="px-3 py-2">Registered voters</th>
                                        <th className="px-3 py-2">Candidate results</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2 text-right">EC8A</th>
                                      </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                      {pollingUnits.map((pu) => {
                                        const candidates = getCandidates(pu)
                                        return (
                                          <tr key={pu.id}>
                                            <td className="px-3 py-3">
                                              <p className="font-bold">{pu.name || 'Unnamed polling unit'}</p>
                                              <p className="mt-1 font-mono text-[10px] text-slate-500">
                                                {pu.code || pu.id}
                                              </p>
                                            </td>
                                            <td className="px-3 py-3 font-mono">
                                              {formatNumber(pu.registered_voters)}
                                            </td>
                                            <td className="min-w-56 px-3 py-3">
                                              {candidates.length ? (
                                                <div className="space-y-1">
                                                  {candidates.map((candidate, index) => (
                                                    <div key={`${candidate.id}-${index}`} className="flex justify-between gap-3">
                                                      <span className="truncate">{candidate.name} <span className="text-slate-500">({candidate.party})</span></span>
                                                      <strong className="shrink-0">{formatNumber(candidate.votes)}</strong>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <span className="text-slate-500">No candidate breakdown</span>
                                              )}
                                            </td>
                                            <td className="px-3 py-3">
                                              <span className={`rounded px-2 py-1 text-[10px] font-bold ${
                                                pu.verification_status === 'VERIFIED'
                                                  ? 'bg-emerald-500/15 text-emerald-500'
                                                  : pu.verification_status === 'FLAGGED' || pu.is_overvote
                                                    ? 'bg-red-500/15 text-red-500'
                                                    : 'bg-amber-500/15 text-amber-500'
                                              }`}>
                                                {pu.verification_status || 'Unknown'}
                                              </span>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                              {pu.ec8a_photo_url ? (
                                                <button
                                                  onClick={() => setPreviewPhotoUrl(pu.ec8a_photo_url)}
                                                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-white"
                                                >
                                                  <Eye className="h-3 w-3" />
                                                  View
                                                </button>
                                              ) : (
                                                <span className="text-slate-500">Not uploaded</span>
                                              )}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <section className={`${cardClass} flex flex-wrap items-center justify-between gap-3 rounded-xl p-4`}>
                    <div>
                      <p className="text-xs font-bold">EC8C sign-off</p>
                      <p className={`mt-1 text-[11px] ${mutedText}`}>
                        Status: {lgaDrilldownData.lga?.signoff?.status || 'PENDING'}
                      </p>
                      {lgaDrilldownData.lga?.signoff?.signer_name && (
                        <p className={`mt-1 text-[10px] ${mutedText}`}>
                          Signed by {lgaDrilldownData.lga.signoff.signer_name}
                        </p>
                      )}
                    </div>
                    {!lgaDrilldownData.lga?.signoff?.is_signed && (
                      <button
                        onClick={() => setShowSignoffConfirm(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Sign off EC8C
                      </button>
                    )}
                  </section>
                </>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-slate-700/20 p-4">
              <button
                onClick={closeInspector}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignoffConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className={`${cardClass} w-full max-w-md space-y-4 rounded-2xl p-6`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <div>
                <h3 className="text-base font-black">Sign off EC8C</h3>
                <p className={`text-xs ${mutedText}`}>
                  {lgaDrilldownData?.lga?.name || 'Selected LGA'}
                </p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${mutedText}`}>
              Confirm that you want to submit the LGA collation sign-off. This action will be sent to the backend.
            </p>

            <textarea
              rows={4}
              value={signoffNotes}
              onChange={(event) => setSignoffNotes(event.target.value)}
              placeholder="Optional collation officer notes..."
              className={`${inputClass} w-full`}
            />

            <div className="flex justify-end gap-2">
              <button
                disabled={signingOff}
                onClick={() => setShowSignoffConfirm(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white"
              >
                Cancel
              </button>
              <button
                disabled={signingOff}
                onClick={handleSignoffSubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {signingOff
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Check className="h-4 w-4" />}
                {signingOff ? 'Submitting...' : 'Confirm sign-off'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewPhotoUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-4xl space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">EC8A result sheet</h3>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex max-h-[75vh] justify-center overflow-auto rounded-xl bg-slate-950 p-2">
              <img
                src={previewPhotoUrl}
                alt="Uploaded EC8A result sheet"
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}