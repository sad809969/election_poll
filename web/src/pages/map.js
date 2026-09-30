import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import JigawaMap from '../components/JigawaMap'
import { apiFetch } from '../lib/api'

const STATUS_OPTIONS = ['All', 'Normal', 'Attention', 'Critical']

function getStatus(pollingUnit, incidents = []) {
  const relatedIncidents = incidents.filter(
    (incident) =>
      String(incident.polling_unit_id) === String(pollingUnit.id)
  )

  if (
    relatedIncidents.some(
      (incident) =>
        String(incident.severity || '').toUpperCase() === 'CRITICAL'
    )
  ) {
    return 'Critical'
  }

  if (
    relatedIncidents.length > 0 ||
    pollingUnit.status === 'Attention' ||
    pollingUnit.status === 'Critical' ||
    pollingUnit.flagged === true
  ) {
    return 'Attention'
  }

  return 'Normal'
}

export default function MapPage() {
  const [pollingUnits, setPollingUnits] = useState([])
  const [lgas, setLgas] = useState([])
  const [results, setResults] = useState([])
  const [incidents, setIncidents] = useState([])

  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedLga, setSelectedLga] = useState('All LGAs')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUnit, setSelectedUnit] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadMapData() {
      setLoading(true)
      setError('')

      const responses = await Promise.allSettled([
        apiFetch('/electoral/polling-units?limit=300'),
        apiFetch('/electoral/lgas'),
        apiFetch('/results?limit=300'),
        apiFetch('/incidents'),
      ])

      if (!active) return

      const [unitsResponse, lgasResponse, resultsResponse, incidentsResponse] =
        responses

      if (unitsResponse.status === 'fulfilled') {
        const data = unitsResponse.value
        setPollingUnits(Array.isArray(data) ? data : data?.polling_units || [])
      } else {
        setError('Could not load polling units. Please check the connection.')
      }

      if (lgasResponse.status === 'fulfilled') {
        const data = lgasResponse.value
        setLgas(Array.isArray(data) ? data : data?.lgas || [])
      }

      if (resultsResponse.status === 'fulfilled') {
        const data = resultsResponse.value
        setResults(Array.isArray(data) ? data : data?.results || [])
      }

      if (incidentsResponse.status === 'fulfilled') {
        const data = incidentsResponse.value
        setIncidents(Array.isArray(data) ? data : data?.incidents || [])
      }

      setLoading(false)
    }

    loadMapData()

    return () => {
      active = false
    }
  }, [])

  const lgaMap = useMemo(() => {
    const map = {}

    lgas.forEach((lga) => {
      map[String(lga.id)] = lga.name
    })

    return map
  }, [lgas])

  const enrichedUnits = useMemo(() => {
    return pollingUnits.map((unit) => {
      const lgaName =
        unit.lga?.name ||
        lgaMap[String(unit.lga_id)] ||
        'Unknown LGA'

      const unitIncidents = incidents.filter(
        (incident) =>
          String(incident.polling_unit_id) === String(unit.id)
      )

      const unitResults = results.filter(
        (result) =>
          String(result.polling_unit_id) === String(unit.id)
      )

      return {
        ...unit,
        lga: lgaName,
        mapStatus: getStatus(unit, incidents),
        unitIncidents,
        unitResults,
      }
    })
  }, [pollingUnits, lgaMap, incidents, results])

  const filteredUnits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return enrichedUnits.filter((unit) => {
      const matchesStatus =
        statusFilter === 'All' || unit.mapStatus === statusFilter

      const matchesLga =
        selectedLga === 'All LGAs' || unit.lga === selectedLga

      const matchesSearch =
        !query ||
        [
          unit.name,
          unit.code,
          unit.polling_unit_code,
          unit.lga,
          unit.ward?.name,
          unit.ward_name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      return matchesStatus && matchesLga && matchesSearch
    })
  }, [enrichedUnits, statusFilter, selectedLga, searchQuery])

  const summary = useMemo(() => {
    return {
      total: enrichedUnits.length,
      normal: enrichedUnits.filter((unit) => unit.mapStatus === 'Normal').length,
      attention: enrichedUnits.filter((unit) => unit.mapStatus === 'Attention').length,
      critical: enrichedUnits.filter((unit) => unit.mapStatus === 'Critical').length,
      incidents: incidents.length,
    }
  }, [enrichedUnits, incidents])

  function openUnit(unit) {
    setSelectedUnit(unit)
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header />

        <div className="space-y-6 p-4 md:p-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Interactive Election Map
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Monitor polling units, incidents, and operational status across
              Jigawa State.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { label: 'Polling Units', value: summary.total },
              { label: 'Normal', value: summary.normal },
              { label: 'Attention', value: summary.attention },
              { label: 'Critical', value: summary.critical },
              { label: 'Incidents', value: summary.incidents },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Map Overview
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select an LGA on the map to filter the polling-unit list.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <JigawaMap
              pollingUnits={enrichedUnits}
              statusFilter={statusFilter}
              selectedLga={selectedLga}
              searchQuery={searchQuery}
              onSelectLga={(name) => {
                setSelectedLga(name || 'All LGAs')
                setSelectedUnit(null)
              }}
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Polling Units
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {filteredUnits.length} of {enrichedUnits.length} units
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={selectedLga}
                  onChange={(event) => setSelectedLga(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="All LGAs">All LGAs</option>
                  {lgas.map((lga) => (
                    <option key={lga.id} value={lga.name}>
                      {lga.name}
                    </option>
                  ))}
                </select>

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search polling units..."
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading map data...
              </p>
            ) : filteredUnits.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No polling units match the selected filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-3">Polling Unit</th>
                      <th className="px-3 py-3">LGA</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Incidents</th>
                      <th className="px-3 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.map((unit) => (
                      <tr
                        key={unit.id}
                        className="border-t border-slate-200 dark:border-slate-800"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">
                          {unit.name || unit.polling_unit_code || unit.code || `Unit ${unit.id}`}
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                          {unit.lga}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              unit.mapStatus === 'Critical'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : unit.mapStatus === 'Attention'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                            }`}
                          >
                            {unit.mapStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                          {unit.unitIncidents.length}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => openUnit(unit)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selectedUnit && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
              <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-900">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Polling Unit Details
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedUnit(null)}
                    className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close details"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Polling unit</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedUnit.name ||
                        selectedUnit.polling_unit_code ||
                        selectedUnit.code ||
                        `Unit ${selectedUnit.id}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">LGA</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedUnit.lga}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Status</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedUnit.mapStatus}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Registered voters</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedUnit.registered_voters ?? 'Not available'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Incidents</p>
                    {selectedUnit.unitIncidents.length === 0 ? (
                      <p className="text-slate-700 dark:text-slate-300">
                        No incidents recorded.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {selectedUnit.unitIncidents.map((incident) => (
                          <li
                            key={incident.id}
                            className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                          >
                            <p className="font-medium text-slate-900 dark:text-white">
                              {incident.title || incident.incident_type || 'Incident'}
                            </p>
                            <p className="mt-1 text-slate-600 dark:text-slate-300">
                              {incident.description || 'No description provided.'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Severity: {incident.severity || 'Not available'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Results records</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedUnit.unitResults.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}