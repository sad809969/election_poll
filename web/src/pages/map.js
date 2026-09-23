import { useState, useEffect, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import JigawaMap from '../components/JigawaMap'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import { 
  MapPin, 
  Filter, 
  Building2, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  X, 
  Phone, 
  ShieldAlert, 
  ChevronRight,
  Eye,
  Loader2
} from 'lucide-react'

export default function InteractiveMapPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedLga, setSelectedLga] = useState('All LGAs')
  const [selectedPu, setSelectedPu] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [pollingUnits, setPollingUnits] = useState([])
  const [lgas, setLgas] = useState(['All LGAs'])
  const [incidentsSummary, setIncidentsSummary] = useState({ critical: 0, high: 0, normal: 0 })

  useEffect(() => {
    async function fetchMapData() {
      try {
        setLoading(true)
        const [puRes, lgaRes, resultsRes, incidentsRes] = await Promise.allSettled([
          apiFetch('/electoral/polling-units?limit=300'),
          apiFetch('/electoral/lgas'),
          apiFetch('/results?limit=300'),
          apiFetch('/incidents')
        ])

        const lgaList = lgaRes.status === 'fulfilled' && Array.isArray(lgaRes.value) ? lgaRes.value : []
        const lgaMap = {}
        lgaList.forEach(l => { lgaMap[l.id] = l.name })
        setLgas(['All LGAs', ...lgaList.map(l => l.name)])

        // Index results by polling_unit_id
        const resultsMap = {}
        if (resultsRes.status === 'fulfilled' && resultsRes.value?.results) {
          resultsRes.value.results.forEach(r => {
            resultsMap[r.polling_unit_id] = r
          })
        }

        // Index incidents by polling_unit_id
        const incidentMap = {}
        let critCount = 0
        let highCount = 0
        if (incidentsRes.status === 'fulfilled' && Array.isArray(incidentsRes.value)) {
          incidentsRes.value.forEach(inc => {
            incidentMap[inc.polling_unit_id] = inc
            if (inc.severity === 'CRITICAL') critCount++
            else if (inc.severity === 'HIGH') highCount++
          })
        }

        const puData = puRes.status === 'fulfilled' && Array.isArray(puRes.value) ? puRes.value : []
        
        if (puData.length > 0) {
          const formatted = puData.map(p => {
            const res = resultsMap[p.id]
            const inc = incidentMap[p.id]
            
            let status = 'Normal'
            if (inc) {
              status = inc.severity === 'CRITICAL' ? 'Critical' : 'Attention'
            } else if (res?.is_overvote || res?.verification_status === 'FLAGGED') {
              status = 'Attention'
            }

            return {
              id: p.code,
              dbId: p.id,
              name: p.name,
              lga: lgaMap[p.lga_id] || 'Jigawa',
              ward: `Ward ${p.ward_id}`,
              status: status,
              agent: res?.agent_name || 'Assigned Polling Agent',
              phone: '0800-PDP-VERIFY',
              registered: p.registered_voters || 500,
              incident: inc ? inc.description : (res?.is_overvote ? 'Over-voting detected: Exceeds voter quota' : 'Normal Operations'),
              time: res?.created_at ? new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
              pdp: res?.pdp_votes ?? 0,
              apc: res?.apc_votes ?? 0,
              total_cast: res?.total_votes_cast ?? 0,
              verification: res?.verification_status || 'NOT_SUBMITTED',
              is_overvote: res?.is_overvote || false,
              ec8a_photo_url: res?.ec8a_photo_url || null,
            }
          })
          setPollingUnits(formatted)
          setIncidentsSummary({
            critical: critCount,
            high: highCount,
            normal: Math.max(0, formatted.length - critCount - highCount)
          })
        }
      } catch (e) {
        console.error('Failed to fetch map polling units:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchMapData()
  }, [])

  const filteredPus = useMemo(() => {
    return pollingUnits.filter(pu => {
      const matchesStatus = statusFilter === 'All' || pu.status === statusFilter
      const matchesLga = selectedLga === 'All LGAs' || pu.lga === selectedLga
      const matchesSearch = pu.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            pu.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            pu.id.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesLga && matchesSearch
    })
  }, [pollingUnits, statusFilter, selectedLga, searchQuery])

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'
  const subcardClass = isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Spatial Intelligence & Geographic Command" 
          subtitle="Real-time geo-spatial distribution across all 4,827 Polling Units in Jigawa State" 
        />

        <main className="p-6 space-y-6">
          {/* Top Controls & Filter Bar */}
          <div className={`${cardClass} rounded-xl p-4 flex flex-wrap items-center justify-between gap-4`}>
            {/* Status Pills */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold mr-1 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Filter className="w-3.5 h-3.5" /> Status Filter:
              </span>
              {['All', 'Normal', 'Attention', 'Critical'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    statusFilter === status 
                      ? status === 'Critical' ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                        : status === 'Attention' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : status === 'Normal' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-emerald-600 text-white'
                      : isDark ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-black'
                  }`}
                >
                  {status === 'Normal' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                  {status === 'Attention' && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
                  {status === 'Critical' && <span className="w-2 h-2 rounded-full bg-red-400"></span>}
                  {status}
                </button>
              ))}
            </div>

            {/* LGA Selector & Search Input */}
            <div className="flex items-center gap-3">
              <select 
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border transition ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {lgas.map(lga => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search PU code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border transition ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Main Map & List Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Canvas (2 Columns) */}
            <div className="lg:col-span-2 space-y-4">
              <JigawaMap statusFilter={statusFilter} />

              {/* Map Footer Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={`${cardClass} rounded-lg p-2.5`}>
                  <span className="text-[10px] text-slate-500 font-semibold block">Total Monitored Units</span>
                  <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {filteredPus.length} Units
                  </span>
                </div>
                <div className={`${cardClass} rounded-lg p-2.5`}>
                  <span className="text-[10px] text-emerald-500 font-semibold block">Normal Operations</span>
                  <span className="text-sm font-extrabold text-emerald-500">
                    {filteredPus.filter(p => p.status === 'Normal').length}
                  </span>
                </div>
                <div className={`${cardClass} rounded-lg p-2.5`}>
                  <span className="text-[10px] text-amber-500 font-semibold block">Attention / Critical</span>
                  <span className="text-sm font-extrabold text-amber-500">
                    {filteredPus.filter(p => p.status !== 'Normal').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Polling Units Live Stream List (1 Column) */}
            <div className={`${cardClass} rounded-xl p-4 flex flex-col h-[440px]`}>
              <div className={`flex justify-between items-center pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div>
                  <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Filtered Polling Units</h3>
                  <p className="text-[10px] text-slate-500">Click unit to view field inspector</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-600'
                }`}>
                  {filteredPus.length} Units
                </span>
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="text-xs">Loading geo coordinates...</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1">
                  {filteredPus.map((pu, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedPu(pu)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        selectedPu?.id === pu.id 
                          ? 'bg-emerald-500/20 border-emerald-500' 
                          : isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            pu.status === 'Critical' ? 'bg-red-500 animate-pulse' 
                              : pu.status === 'Attention' ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                          }`}></span>
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pu.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">LGA: {pu.lga} • Code: {pu.id}</p>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-emerald-400 font-bold">PDP: {pu.pdp}</span>
                          <span className="text-blue-400 font-bold">APC: {pu.apc}</span>
                          <span className="text-slate-400 font-mono">Total: {pu.total_cast}</span>
                        </div>
                        {pu.status !== 'Normal' && (
                          <p className="text-[10px] font-semibold text-amber-400">{pu.incident}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected PU Detail Drawer */}
          {selectedPu && (
            <div className={`${cardClass} border-emerald-500/50 rounded-xl p-5 shadow-lg space-y-4 animate-in fade-in duration-200`}>
              <div className={`flex justify-between items-start pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      selectedPu.status === 'Critical' ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                        : selectedPu.status === 'Attention' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                    }`}>
                      STATUS: {selectedPu.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {selectedPu.id}
                    </span>
                    {selectedPu.is_overvote && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Over-voting Breach
                      </span>
                    )}
                  </div>
                  <h3 className={`text-base font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedPu.name}</h3>
                  <p className="text-xs text-slate-500">Ward: {selectedPu.ward} • LGA: {selectedPu.lga} LGA</p>
                </div>
                <button onClick={() => setSelectedPu(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className={`${subcardClass} p-3 rounded-lg`}>
                  <span className="text-[10px] text-slate-500 font-bold block">ASSIGNED AGENT</span>
                  <span className={`font-extrabold text-sm block mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedPu.agent}</span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {selectedPu.phone}
                  </span>
                </div>

                <div className={`${subcardClass} p-3 rounded-lg`}>
                  <span className="text-[10px] text-slate-500 font-bold block">REGISTERED CAPACITY</span>
                  <span className={`font-extrabold text-sm block mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedPu.registered} Registered</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Total Cast: {selectedPu.total_cast}</span>
                </div>

                <div className={`${subcardClass} p-3 rounded-lg`}>
                  <span className="text-[10px] text-slate-500 font-bold block">LIVE VOTE TALLY</span>
                  <span className="font-extrabold text-emerald-500 text-sm block mt-0.5">PDP: {selectedPu.pdp} votes</span>
                  <span className="text-[10px] text-blue-400 font-bold block mt-1">APC: {selectedPu.apc} votes</span>
                </div>

                <div className={`${subcardClass} p-3 rounded-lg`}>
                  <span className="text-[10px] text-slate-500 font-bold block">EC8A PROOF VERIFICATION</span>
                  <span className={`font-extrabold text-xs block mt-0.5 ${
                    selectedPu.verification === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {selectedPu.verification}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Time: {selectedPu.time}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
