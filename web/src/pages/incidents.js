import { useState, useEffect, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Eye,
  Phone,
  MapPin,
  X,
  RefreshCw,
} from 'lucide-react'

const SEVERITIES = ['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const STATUSES = ['All', 'REPORTED', 'INVESTIGATING', 'RESOLVED']

function normalizeIncident(incident) {
  return {
    ...incident,
    id: incident.id,
    pu:
      incident.pu ||
      incident.polling_unit?.name ||
      incident.polling_unit_name ||
      incident.polling_unit ||
      incident.pu_code ||
      'Not available',
    lga:
      incident.lga?.name ||
      incident.lga_name ||
      incident.lga ||
      'Not available',
    category:
      incident.category ||
      incident.incident_type ||
      incident.type ||
      'Not specified',
    severity: String(incident.severity || 'UNKNOWN').toUpperCase(),
    status: String(incident.status || 'REPORTED').toUpperCase(),
    reporter:
      incident.reporter?.full_name ||
      incident.reported_by?.full_name ||
      incident.reporter ||
      incident.reported_by ||
      'Not available',
    phone:
      incident.phone ||
      incident.contact ||
      incident.reporter?.phone ||
      incident.reported_by?.phone ||
      'Not available',
    time:
      incident.created_at ||
      incident.time ||
      incident.reported_at ||
      null,
    desc:
      incident.description ||
      incident.desc ||
      incident.title ||
      'No description provided.',
  }
}

function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString()
}

function severityStyle(severity) {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-500 border-red-500/40'
    case 'HIGH':
      return 'bg-amber-500/20 text-amber-500 border-amber-500/40'
    case 'MEDIUM':
      return 'bg-blue-500/20 text-blue-500 border-blue-500/40'
    case 'LOW':
      return 'bg-slate-500/20 text-slate-500 border-slate-500/40'
    default:
      return 'bg-slate-500/20 text-slate-500 border-slate-500/40'
  }
}

function statusStyle(status) {
  switch (status) {
    case 'RESOLVED':
      return 'bg-emerald-500/20 text-emerald-500'
    case 'INVESTIGATING':
      return 'bg-amber-500/20 text-amber-500'
    case 'REPORTED':
      return 'bg-red-500/20 text-red-500'
    default:
      return 'bg-slate-500/20 text-slate-500'
  }
}

export default function IncidentTrackerPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [incidentsList, setIncidentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  async function loadIncidents() {
    try {
      setLoading(true)
      setError('')

      const data = await apiFetch('/incidents')

      const incidents = Array.isArray(data)
        ? data
        : Array.isArray(data?.incidents)
          ? data.incidents
          : Array.isArray(data?.items)
            ? data.items
            : []

      setIncidentsList(incidents.map(normalizeIncident))
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load incidents:', err)
      setError(err?.message || 'Unable to load incidents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  const filteredIncidents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return incidentsList.filter((incident) => {
      const matchesSeverity =
        severityFilter === 'All' ||
        incident.severity === severityFilter

      const matchesStatus =
        statusFilter === 'All' ||
        incident.status === statusFilter

      const searchableText = [
        incident.pu,
        incident.lga,
        incident.category,
        incident.reporter,
        incident.phone,
        incident.desc,
        incident.status,
        incident.severity,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchableText.includes(query)

      return matchesSeverity && matchesStatus && matchesSearch
    })
  }, [incidentsList, severityFilter, statusFilter, searchQuery])

  const criticalCount = incidentsList.filter(
    (incident) => incident.severity === 'CRITICAL'
  ).length

  const highCount = incidentsList.filter(
    (incident) => incident.severity === 'HIGH'
  ).length

  const medLowCount = incidentsList.filter(
    (incident) =>
      incident.severity === 'MEDIUM' ||
      incident.severity === 'LOW'
  ).length

  const resolvedCount = incidentsList.filter(
    (incident) => incident.status === 'RESOLVED'
  ).length

  const resolutionRate =
    incidentsList.length > 0
      ? ((resolvedCount / incidentsList.length) * 100).toFixed(1)
      : '0.0'

  const cardClass = isDark
    ? 'bg-[#141E38] border border-slate-800'
    : 'bg-white border border-slate-200 shadow-sm'

  const subcardClass = isDark
    ? 'bg-slate-900 border border-slate-800'
    : 'bg-slate-50 border border-slate-200'

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#070D1E] text-slate-100'
          : 'bg-slate-50 text-slate-800'
      }`}
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Header
          title="Incident Command Center"
          subtitle="Field incident monitoring, severity triage, and situation room dispatch"
        />

        <main className="space-y-6 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Incident Tracker
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Monitor and review incidents reported by field agents.
              </p>
            </div>

            <button
              type="button"
              onClick={loadIncidents}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>

          {loading && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-500">
              Loading incident records...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
              <p className="font-bold">Unable to load incidents</p>
              <p className="mt-1">{error}</p>
              <p className="mt-1">
                The incident list may be incomplete. Please refresh after
                checking the server connection.
              </p>
            </div>
          )}

          {!loading && !error && incidentsList.length === 0 && (
            <div className="rounded-lg border border-slate-300 bg-slate-100 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              No incidents have been recorded in the available API response.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div
              className={`${cardClass} flex items-center justify-between rounded-xl border-red-500/30 p-4`}
            >
              <div>
                <span className="text-xs font-bold text-red-500">
                  Critical Incidents
                </span>
                <h3
                  className={`mt-1 text-2xl font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {criticalCount}
                </h3>
                <p className="mt-0.5 text-[10px] text-red-400">
                  Critical severity reports
                </p>
              </div>
              <div className="rounded-xl bg-red-500/20 p-3 text-red-500">
                <ShieldAlert className="h-6 w-6" />
              </div>
            </div>

            <div
              className={`${cardClass} flex items-center justify-between rounded-xl border-amber-500/30 p-4`}
            >
              <div>
                <span className="text-xs font-bold text-amber-500">
                  High Priority
                </span>
                <h3
                  className={`mt-1 text-2xl font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {highCount}
                </h3>
                <p className="mt-0.5 text-[10px] text-amber-500">
                  High severity reports
                </p>
              </div>
              <div className="rounded-xl bg-amber-500/20 p-3 text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>

            <div
              className={`${cardClass} flex items-center justify-between rounded-xl border-blue-500/30 p-4`}
            >
              <div>
                <span className="text-xs font-bold text-blue-500">
                  Medium / Low Priority
                </span>
                <h3
                  className={`mt-1 text-2xl font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {medLowCount}
                </h3>
                <p className="mt-0.5 text-[10px] text-blue-500">
                  Medium and low severity reports
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/20 p-3 text-blue-500">
                <Clock className="h-6 w-6" />
              </div>
            </div>

            <div
              className={`${cardClass} flex items-center justify-between rounded-xl border-emerald-500/30 p-4`}
            >
              <div>
                <span className="text-xs font-bold text-emerald-500">
                  Resolved Incidents
                </span>
                <h3
                  className={`mt-1 text-2xl font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {resolvedCount}
                </h3>
                <p className="mt-0.5 text-[10px] text-emerald-500">
                  {resolutionRate}% resolution rate
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div
            className={`${cardClass} flex flex-col gap-4 rounded-xl p-4 xl:flex-row xl:items-center xl:justify-between`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`flex items-center gap-1 text-xs font-bold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Severity:
              </span>

              {SEVERITIES.map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setSeverityFilter(severity)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    severityFilter === severity
                      ? 'bg-pdp text-white shadow-md'
                      : isDark
                        ? 'border border-slate-800 bg-slate-900 text-slate-400'
                        : 'border border-slate-200 bg-slate-100 text-slate-600'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold outline-none ${
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-200'
                    : 'border-slate-300 bg-slate-50 text-slate-900'
                }`}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === 'All' ? 'All Statuses' : status}
                  </option>
                ))}
              </select>

              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className={`w-full rounded-lg border py-2 pl-8 pr-3 text-xs outline-none ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className={`${cardClass} space-y-4 rounded-xl p-4 md:p-5`}>
            <div
              className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <h2
                className={`text-sm font-bold ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                Field Incidents Queue
              </h2>

              <div className="text-right text-xs text-slate-400">
                <p>Showing {filteredIncidents.length} of {incidentsList.length}</p>
                {lastUpdated && (
                  <p className="mt-1">
                    Last refreshed: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                <thead>
                  <tr
                    className={`border-y font-bold text-slate-500 ${
                      isDark
                        ? 'border-slate-800 bg-slate-900'
                        : 'border-slate-200 bg-slate-100'
                    }`}
                  >
                    <th className="px-3 py-3">Polling Unit</th>
                    <th className="px-3 py-3">LGA</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Severity</th>
                    <th className="px-3 py-3">Description</th>
                    <th className="px-3 py-3">Reporter</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody
                  className={`divide-y font-medium ${
                    isDark ? 'divide-slate-800/80' : 'divide-slate-100'
                  }`}
                >
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-10 text-center text-slate-500"
                      >
                        Loading incidents...
                      </td>
                    </tr>
                  ) : filteredIncidents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-10 text-center text-slate-500"
                      >
                        No incidents match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((incident, index) => (
                      <tr
                        key={incident.id ?? index}
                        className={`transition ${
                          isDark
                            ? 'hover:bg-slate-900/50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td
                          className={`px-3 py-3 font-bold ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {incident.pu}
                        </td>
                        <td className="px-3 py-3 text-slate-500">
                          {incident.lga}
                        </td>
                        <td className="px-3 py-3 text-slate-500">
                          {incident.category}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded border px-2.5 py-0.5 text-[10px] font-extrabold ${severityStyle(
                              incident.severity
                            )}`}
                          >
                            {incident.severity}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-3 py-3 text-slate-500">
                          {incident.desc}
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                          <span>{incident.reporter}</span>
                          <span className="block font-mono text-[10px] text-slate-400">
                            {incident.phone}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(
                              incident.status
                            )}`}
                          >
                            {incident.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-400">
                          {formatDate(incident.time)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedIncident(incident)}
                            className={`ml-auto flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-bold transition ${
                              isDark
                                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                                : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedIncident && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedIncident(null)
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="incident-modal-title"
                className={`${cardClass} max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl p-5 shadow-xl md:p-6`}
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <h2
                    id="incident-modal-title"
                    className="flex items-center gap-2 text-sm font-bold"
                  >
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    Incident Detail #{selectedIncident.id ?? 'N/A'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedIncident(null)}
                    aria-label="Close incident details"
                    className="rounded-lg p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className={`${subcardClass} rounded-lg p-3`}>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Location & Unit
                    </span>
                    <p className="mt-1 text-sm font-bold">
                      {selectedIncident.pu}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-slate-400">
                      <MapPin className="h-3 w-3" />
                      LGA: {selectedIncident.lga}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`${subcardClass} rounded-lg p-3`}>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Category
                      </span>
                      <p className="mt-1 font-bold">
                        {selectedIncident.category}
                      </p>
                    </div>
                    <div className={`${subcardClass} rounded-lg p-3`}>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Severity / Status
                      </span>
                      <p className="mt-1 font-bold">
                        {selectedIncident.severity} / {selectedIncident.status}
                      </p>
                    </div>
                  </div>

                  <div className={`${subcardClass} rounded-lg p-3`}>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Reporter Information
                    </span>
                    <p className="mt-1 font-bold">
                      {selectedIncident.reporter}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-slate-400">
                      <Phone className="h-3 w-3" />
                      {selectedIncident.phone}
                    </p>
                  </div>

                  <div className={`${subcardClass} rounded-lg p-3`}>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Reported At
                    </span>
                    <p className="mt-1">{formatDate(selectedIncident.time)}</p>
                  </div>

                  <div className={`${subcardClass} rounded-lg p-3`}>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Description
                    </span>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                      {selectedIncident.desc}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIncident(null)}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}