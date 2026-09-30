import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Loader2,
  Eye,
  MapPin,
  Users,
  User,
  ChevronDown,
} from 'lucide-react'

const EMPTY_FORM = {
  lga_id: '',
  ward_id: '',
  code: '',
  name: '',
  registered_voters: '',
  latitude: '',
  longitude: '',
}

export default function PollingUnitsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [pollingUnits, setPollingUnits] = useState([])
  const [lgas, setLgas] = useState([])
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const [statusFilter, setStatusFilter] = useState('All')
  const [lgaFilter, setLgaFilter] = useState('All')
  const [wardFilter, setWardFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [deleteConfirmUnit, setDeleteConfirmUnit] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [actionLoading, setActionLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const cardClass = isDark
    ? 'bg-[#141E38] border border-slate-800'
    : 'bg-white border border-slate-200 shadow-sm'

  const textMain = isDark ? 'text-white' : 'text-slate-900'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputClass = `w-full rounded-lg border px-3 py-2 text-xs outline-none ${
    isDark
      ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`

  const getRecords = (data, key) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(data?.items)) return data.items
    return null
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [puResponse, lgaResponse, wardResponse] = await Promise.all([
        apiFetch('/electoral/polling-units'),
        apiFetch('/electoral/lgas'),
        apiFetch('/electoral/wards'),
      ])

      const puRecords = getRecords(puResponse, 'polling_units')
      const lgaRecords = getRecords(lgaResponse, 'lgas')
      const wardRecords = getRecords(wardResponse, 'wards')

      if (!puRecords || !lgaRecords || !wardRecords) {
        throw new Error('The backend returned an unsupported response format.')
      }

      setPollingUnits(puRecords)
      setLgas(lgaRecords)
      setWards(wardRecords)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load polling-unit data:', err)
      setError(err.message || 'Unable to load polling-unit data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getLga = (unit) => {
    const nested = unit.lga?.name
    if (nested) return nested

    return (
      unit.lga_name ||
      lgas.find((lga) => String(lga.id) === String(unit.lga_id))?.name ||
      'Not available'
    )
  }

  const getWard = (unit) => {
    const nested = unit.ward?.name
    if (nested) return nested

    return (
      unit.ward_name ||
      wards.find((ward) => String(ward.id) === String(unit.ward_id))?.name ||
      'Not available'
    )
  }

  const getAgent = (unit) => {
    const agent = unit.agent || unit.assigned_agent
    if (agent && typeof agent === 'object') {
      return agent.full_name || agent.name || agent.username || 'Assigned'
    }

    return (
      unit.agent_name ||
      unit.assigned_agent_name ||
      (typeof agent === 'string' ? agent : '') ||
      'Not assigned'
    )
  }

  const getStatus = (unit) => {
    const status = unit.status || unit.health_status
    if (!status) return 'Unavailable'

    const normalized = String(status).toLowerCase()

    if (normalized === 'normal' || normalized === 'healthy') return 'Normal'
    if (normalized === 'attention' || normalized === 'warning') return 'Attention'
    if (normalized === 'critical' || normalized === 'high') return 'Critical'

    return String(status)
  }

  const getResultProgress = (unit) => {
    const value =
      unit.result_progress ??
      unit.results_progress ??
      unit.result_completion ??
      unit.results_submitted

    if (value === undefined || value === null || value === '') {
      return null
    }

    if (typeof value === 'number') {
      return value <= 1 && value >= 0
        ? `${Math.round(value * 100)}%`
        : `${value}%`
    }

    return String(value)
  }

  const normalCount = pollingUnits.filter(
    (unit) => getStatus(unit) === 'Normal'
  ).length

  const attentionCount = pollingUnits.filter(
    (unit) => getStatus(unit) === 'Attention'
  ).length

  const criticalCount = pollingUnits.filter(
    (unit) => getStatus(unit) === 'Critical'
  ).length

  const filteredWards =
    lgaFilter === 'All'
      ? wards
      : wards.filter(
          (ward) => String(ward.lga_id) === String(lgaFilter)
        )

  const filteredUnits = pollingUnits.filter((unit) => {
    const status = getStatus(unit)

    const matchesStatus =
      statusFilter === 'All' || status === statusFilter

    const matchesLga =
      lgaFilter === 'All' ||
      String(unit.lga_id) === String(lgaFilter) ||
      String(unit.lga?.id) === String(lgaFilter)

    const matchesWard =
      wardFilter === 'All' ||
      String(unit.ward_id) === String(wardFilter) ||
      String(unit.ward?.id) === String(wardFilter)

    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query ||
      [
        unit.name,
        unit.code,
        unit.polling_unit_code,
        getLga(unit),
        getWard(unit),
        getAgent(unit),
      ].some((value) => String(value || '').toLowerCase().includes(query))

    return matchesStatus && matchesLga && matchesWard && matchesSearch
  })

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(''), 4000)
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setEditingUnit(null)
    setShowModal(false)
    setActionError('')
  }

  const openCreateModal = () => {
    setEditingUnit(null)
    setFormData(EMPTY_FORM)
    setActionError('')
    setShowModal(true)
  }

  const openEditModal = (unit) => {
    setEditingUnit(unit)
    setFormData({
      lga_id: unit.lga_id ?? unit.lga?.id ?? '',
      ward_id: unit.ward_id ?? unit.ward?.id ?? '',
      code: unit.code ?? unit.polling_unit_code ?? '',
      name: unit.name ?? '',
      registered_voters: unit.registered_voters ?? '',
      latitude: unit.latitude ?? '',
      longitude: unit.longitude ?? '',
    })
    setActionError('')
    setShowModal(true)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'lga_id' ? { ward_id: '' } : {}),
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setActionLoading(true)
    setActionError('')

    const payload = {
      lga_id: Number(formData.lga_id),
      ward_id: Number(formData.ward_id),
      code: formData.code.trim(),
      name: formData.name.trim(),
      registered_voters:
        formData.registered_voters === ''
          ? null
          : Number(formData.registered_voters),
      latitude:
        formData.latitude === '' ? null : Number(formData.latitude),
      longitude:
        formData.longitude === '' ? null : Number(formData.longitude),
    }

    try {
      if (editingUnit) {
        await apiFetch(`/electoral/polling-units/${editingUnit.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        showToast('Polling unit updated successfully.')
      } else {
        await apiFetch('/electoral/polling-units', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        showToast('Polling unit created successfully.')
      }

      resetForm()
      await loadData()
    } catch (err) {
      console.error('Failed to save polling unit:', err)
      setActionError(err.message || 'Unable to save polling unit.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (unit) => {
    setActionLoading(true)
    setActionError('')

    try {
      await apiFetch(`/electoral/polling-units/${unit.id}`, {
        method: 'DELETE',
      })

      setDeleteConfirmUnit(null)

      if (selectedUnit?.id === unit.id) {
        setSelectedUnit(null)
      }

      showToast('Polling unit deleted successfully.')
      await loadData()
    } catch (err) {
      console.error('Failed to delete polling unit:', err)
      setActionError(err.message || 'Unable to delete polling unit.')
    } finally {
      setActionLoading(false)
    }
  }

  const statusBadge = (unit) => {
    const status = getStatus(unit)

    const styles = {
      Normal: 'bg-emerald-500/15 text-emerald-500',
      Attention: 'bg-amber-500/15 text-amber-500',
      Critical: 'bg-rose-500/15 text-rose-500',
      Unavailable: 'bg-slate-500/15 text-slate-400',
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          styles[status] || styles.Unavailable
        }`}
      >
        {status === 'Normal' ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        {status}
      </span>
    )
  }

  const detailRows = selectedUnit
    ? [
        ['Polling Unit Name', selectedUnit.name],
        ['Polling Unit Code', selectedUnit.code || selectedUnit.polling_unit_code],
        ['LGA', getLga(selectedUnit)],
        ['Ward', getWard(selectedUnit)],
        ['Registered Voters', selectedUnit.registered_voters],
        ['Assigned Agent', getAgent(selectedUnit)],
        ['Health Status', getStatus(selectedUnit)],
        ['Result Progress', getResultProgress(selectedUnit) ?? 'Unavailable'],
        ['Latitude', selectedUnit.latitude],
        ['Longitude', selectedUnit.longitude],
        ['Created At', selectedUnit.created_at],
      ]
    : []

  return (
    <div
      className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
        isDark
          ? 'bg-[#070D1E] text-slate-100'
          : 'bg-slate-50 text-slate-800'
      }`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Polling Units Directory"
          subtitle="Monitor and manage polling-unit records"
        />

        <main className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={`text-lg font-extrabold ${textMain}`}>
                Polling Units
              </h2>
              <p className={`text-xs mt-1 ${muted}`}>
                Electoral locations, agent assignments, and field status.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>

              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-pdp px-3 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Add Polling Unit
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-500">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold">
                  Could not load polling-unit data
                </p>
                <p className="mt-1 break-words text-xs">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-2 text-xs font-bold underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className={`text-xs font-bold ${muted}`}>
                  Total Polling Units
                </span>
                <h3 className={`text-2xl font-extrabold mt-1 ${textMain}`}>
                  {loading && pollingUnits.length === 0
                    ? '—'
                    : pollingUnits.length.toLocaleString()}
                </h3>
                <p className={`text-[10px] mt-1 ${muted}`}>
                  Records returned by backend
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/15 text-blue-500">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold text-emerald-500">
                  Normal
                </span>
                <h3 className={`text-2xl font-extrabold mt-1 ${textMain}`}>
                  {normalCount}
                </h3>
                <p className="text-[10px] text-emerald-500 mt-1">
                  Reported normal status
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold text-amber-500">
                  Attention
                </span>
                <h3 className={`text-2xl font-extrabold mt-1 ${textMain}`}>
                  {attentionCount}
                </h3>
                <p className="text-[10px] text-amber-500 mt-1">
                  Reported attention status
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/15 text-amber-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold text-rose-500">
                  Critical
                </span>
                <h3 className={`text-2xl font-extrabold mt-1 ${textMain}`}>
                  {criticalCount}
                </h3>
                <p className="text-[10px] text-rose-500 mt-1">
                  Reported critical status
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/15 text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-xl p-4 flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold flex items-center gap-1 ${muted}`}>
                <Filter className="w-3.5 h-3.5" />
                Status:
              </span>

              {['All', 'Normal', 'Attention', 'Critical'].map((status) => (
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

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                value={lgaFilter}
                onChange={(event) => {
                  setLgaFilter(event.target.value)
                  setWardFilter('All')
                }}
                className={inputClass + ' w-full sm:w-44'}
              >
                <option value="All">All LGAs</option>
                {lgas.map((lga) => (
                  <option key={lga.id} value={String(lga.id)}>
                    {lga.name}
                  </option>
                ))}
              </select>

              <select
                value={wardFilter}
                onChange={(event) => setWardFilter(event.target.value)}
                className={inputClass + ' w-full sm:w-44'}
              >
                <option value="All">All Wards</option>
                {filteredWards.map((ward) => (
                  <option key={ward.id} value={String(ward.id)}>
                    {ward.name}
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, name, agent..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className={inputClass + ' pl-8'}
                />
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-xl p-5 space-y-4`}>
            <div className={`flex flex-wrap justify-between items-center gap-2 pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <h3 className={`text-xs font-bold ${textMain}`}>
                Polling Unit Master Directory
              </h3>
              <span className={`text-xs font-mono ${muted}`}>
                Showing {filteredUnits.length} of {pollingUnits.length} units
                {lastUpdated && (
                  <span className="ml-2">
                    · Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </span>
            </div>

            {loading && pollingUnits.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-bold">
                  Loading polling units...
                </span>
              </div>
            ) : !error && filteredUnits.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                <Building2 className="w-8 h-8 opacity-30" />
                <span className="text-xs font-bold">
                  {pollingUnits.length === 0
                    ? 'No polling units returned by the backend.'
                    : 'No polling units match your filters.'}
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-y text-slate-500 font-bold ${
                      isDark
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-slate-100 border-slate-200'
                    }`}>
                      <th className="py-3 px-3">PU Code</th>
                      <th className="py-3 px-3">Polling Unit Name</th>
                      <th className="py-3 px-3">Ward</th>
                      <th className="py-3 px-3">LGA</th>
                      <th className="py-3 px-3">Registered Voters</th>
                      <th className="py-3 px-3">Assigned Agent</th>
                      <th className="py-3 px-3">Health Status</th>
                      <th className="py-3 px-3">Result Progress</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className={`divide-y font-medium ${
                    isDark ? 'divide-slate-800/80' : 'divide-slate-100'
                  }`}>
                    {filteredUnits.map((unit) => (
                      <tr
                        key={unit.id ?? unit.code}
                        className={`transition ${
                          isDark
                            ? 'hover:bg-slate-900/50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-extrabold text-pdp">
                          {unit.code || unit.polling_unit_code || '—'}
                        </td>
                        <td className={`py-3 px-3 font-bold ${textMain}`}>
                          {unit.name || 'Name unavailable'}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {getWard(unit)}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {getLga(unit)}
                        </td>
                        <td className={`py-3 px-3 font-bold ${textMain}`}>
                          {unit.registered_voters == null
                            ? '—'
                            : Number(unit.registered_voters).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {getAgent(unit)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {statusBadge(unit)}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {getResultProgress(unit) ?? 'Unavailable'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedUnit(unit)}
                              title="View details"
                              className="rounded-lg border border-pdp/30 p-1.5 text-pdp hover:bg-pdp hover:text-white"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(unit)}
                              title="Edit polling unit"
                              className="rounded-lg border border-amber-500/30 p-1.5 text-amber-500 hover:bg-amber-500/10"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmUnit(unit)}
                              title="Delete polling unit"
                              className="rounded-lg border border-rose-500/30 p-1.5 text-rose-500 hover:bg-rose-500/10"
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`${cardClass} max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl p-6 shadow-2xl`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className={`text-base font-extrabold ${textMain}`}>
                  {editingUnit ? 'Edit Polling Unit' : 'Add Polling Unit'}
                </h3>
                <p className={`mt-1 text-xs ${muted}`}>
                  Save the polling-unit record through the backend.
                </p>
              </div>
              <button
                onClick={resetForm}
                className={`rounded-lg p-2 ${
                  isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={`space-y-1 text-xs font-bold ${muted}`}>
                  LGA
                  <select
                    name="lga_id"
                    value={formData.lga_id}
                    onChange={handleFormChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select LGA</option>
                    {lgas.map((lga) => (
                      <option key={lga.id} value={lga.id}>
                        {lga.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={`space-y-1 text-xs font-bold ${muted}`}>
                  Ward
                  <select
                    name="ward_id"
                    value={formData.ward_id}
                    onChange={handleFormChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select Ward</option>
                    {wards
                      .filter(
                        (ward) =>
                          !formData.lga_id ||
                          String(ward.lga_id) === String(formData.lga_id)
                      )
                      .map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className={`space-y-1 text-xs font-bold ${muted}`}>
                  Polling Unit Code
                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    required
                    className={inputClass}
                    placeholder="Enter polling unit code"
                  />
                </label>

                <label className={`space-y-1 text-xs font-bold ${muted}`}>
                  Polling Unit Name
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className={inputClass}
                    placeholder="Enter polling unit name"
                  />
                </label>

                <label className={`space-y-1 text-xs font-bold ${muted}`}>
                  Registered Voters
                  <input
                    type="number"
                    min="0"
                    name="registered_voters"
                    value={formData.registered_voters}
                    onChange={handleFormChange}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </label>

                <label className={`space-y-1 text-xs font-bold ${muted}`}>
                  Latitude
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleFormChange}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </label>

                <label className={`space-y-1 text-xs font-bold ${muted} sm:col-span-2`}>
                  Longitude
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleFormChange}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={actionLoading}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-pdp px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {actionLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingUnit ? 'Save Changes' : 'Create Polling Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedUnit && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedUnit(null)}
        >
          <div
            className={`${cardClass} max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-700 pb-4">
              <div>
                <h3 className={`text-base font-extrabold ${textMain}`}>
                  Polling Unit Details
                </h3>
                <p className={`mt-1 text-xs ${muted}`}>
                  Information returned by the backend.
                </p>
              </div>
              <button
                onClick={() => setSelectedUnit(null)}
                aria-label="Close details"
                className="rounded-lg p-2 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pdp/15 text-pdp">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`font-extrabold ${textMain}`}>
                  {selectedUnit.name || 'Name unavailable'}
                </h4>
                <p className="font-mono text-xs text-slate-400">
                  {selectedUnit.code || selectedUnit.polling_unit_code || 'Code unavailable'}
                </p>
              </div>
              {statusBadge(selectedUnit)}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {detailRows.map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-lg border p-3 ${
                    isDark
                      ? 'border-slate-800 bg-slate-900/60'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className={`mt-1 break-words text-xs font-semibold ${textMain}`}>
                    {value === null || value === undefined || value === ''
                      ? 'Not available'
                      : String(value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedUnit(null)
                  openEditModal(selectedUnit)
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-500 hover:bg-amber-500/10"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => setSelectedUnit(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className={`${cardClass} w-full max-w-md space-y-4 rounded-2xl border border-rose-500/30 p-6 shadow-2xl`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${textMain}`}>
                  Confirm Delete
                </h3>
                <p className="text-xs text-slate-400">
                  {deleteConfirmUnit.name || 'Polling unit'}
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-400">
              Are you sure you want to delete this polling unit? The backend
              may reject deletion if the unit has linked agents, results, or
              incidents.
            </p>

            {actionError && (
              <p className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-500">
                {actionError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setDeleteConfirmUnit(null)
                  setActionError('')
                }}
                disabled={actionLoading}
                className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmUnit)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-500 disabled:opacity-50"
              >
                {actionLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}