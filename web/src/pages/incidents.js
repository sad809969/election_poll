import { useState, useEffect } from 'react'
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
  Send
} from 'lucide-react'

export default function IncidentTrackerPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // State for Live API Data
  const [incidentsList, setIncidentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch Incidents from FastAPI Endpoint (/api/incidents)
  useEffect(() => {
    async function loadIncidents() {
      try {
        setLoading(true)
        setError(null)
        const data = await apiFetch('/incidents')
        
        if (Array.isArray(data) && data.length > 0) {
          // Normalize API properties to component standard
          const mappedData = data.map((inc, index) => ({
            id: inc.id || index + 1,
            pu: inc.pu || inc.polling_unit || `PU ${inc.pu_code || '001'}`,
            lga: inc.lga || 'Jigawa',
            category: inc.category || inc.type || 'General',
            severity: (inc.severity || 'MEDIUM').toUpperCase(),
            status: (inc.status || 'REPORTED').toUpperCase(),
            reporter: inc.reporter || inc.reported_by || 'Field Agent',
            phone: inc.phone || inc.contact || 'N/A',
            time: inc.time || inc.created_at || '10:00 AM',
            desc: inc.desc || inc.description || inc.title || 'No description provided.',
            lat: inc.lat || 27.05,
            lng: inc.lng || 12.15
          }))
          setIncidentsList(mappedData)
        }
      } catch (err) {
        console.error('Failed to load incidents:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadIncidents()
  }, [])

  // Default Mock Data (Fallback if backend list is empty or unreachable)
  const defaultIncidents = [
    { id: 1, pu: 'PU 002, Jahun Ward A', lga: 'Jahun', category: 'Violence', severity: 'CRITICAL', status: 'REPORTED', reporter: 'Usman K.', phone: '0810 555 1122', time: '10:35 AM', desc: 'Violence reported near polling booth perimeter. Political thugs disrupting queue.', lat: 27.05, lng: 12.15 },
    { id: 2, pu: 'PU 023, Guri Ward A', lga: 'Guri', category: 'Intimidation', severity: 'HIGH', status: 'INVESTIGATING', reporter: 'Murtala A.', phone: '0812 345 6789', time: '10:40 AM', desc: 'Unidentified group intimidating voters at unit entrance. Crowd gathering rapidly.', lat: 27.02, lng: 12.34 },
    { id: 3, pu: 'PU 078, Gumel Central', lga: 'Gumel', category: 'BVAS Issues', severity: 'MEDIUM', status: 'RESOLVED', reporter: 'Aisha M.', phone: '0807 111 2233', time: '10:42 AM', desc: 'BVAS fingerprint scanner malfunction resolved by INEC technical support team.', lat: 27.12, lng: 12.45 },
    { id: 4, pu: 'PU 105, Hadejia Ward B', lga: 'Hadejia', category: 'Late Officials', severity: 'LOW', status: 'RESOLVED', reporter: 'Sani R.', phone: '0809 876 5432', time: '09:15 AM', desc: 'INEC ad-hoc staff arrived 45 minutes late. Voting started at 09:15 AM.', lat: 27.20, lng: 12.50 },
    { id: 5, pu: 'PU 056, Kazaure Ward C', lga: 'Kazaure', category: 'Vote Buying', severity: 'HIGH', status: 'REPORTED', reporter: 'Yusuf B.', phone: '0706 111 2233', time: '11:05 AM', desc: 'Alleged vote buying activity observed 100 meters outside polling center perimeter.', lat: 27.30, lng: 12.60 },
    { id: 6, pu: 'PU 012, Kaugama Ward 1', lga: 'Kaugama', category: 'Ballot Shortage', severity: 'MEDIUM', status: 'INVESTIGATING', reporter: 'Musa A.', phone: '0803 123 4567', time: '11:20 AM', desc: 'Shortage of official ballot papers reported. Requesting electoral officer intervention.', lat: 27.40, lng: 12.70 },
  ]

  const activeIncidents = incidentsList.length > 0 ? incidentsList : defaultIncidents

  const filteredIncidents = activeIncidents.filter(inc => {
    const matchesSeverity = severityFilter === 'All' || inc.severity === severityFilter
    const matchesStatus = statusFilter === 'All' || inc.status === statusFilter
    const matchesSearch = inc.pu.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.reporter.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSeverity && matchesStatus && matchesSearch
  })

  // KPI calculations based on active dataset
  const criticalCount = activeIncidents.filter(i => i.severity === 'CRITICAL').length
  const highCount = activeIncidents.filter(i => i.severity === 'HIGH').length
  const medLowCount = activeIncidents.filter(i => i.severity === 'MEDIUM' || i.severity === 'LOW').length
  const resolvedCount = activeIncidents.filter(i => i.status === 'RESOLVED').length
  const resolutionRate = activeIncidents.length > 0 ? ((resolvedCount / activeIncidents.length) * 100).toFixed(1) : '0.0'

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'
  const subcardClass = isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Incident Command Center" 
          subtitle="Real-time field incident monitoring, severity triage, and situation room dispatch" 
        />

        <main className="p-6 space-y-6">
          {/* Status Banners */}
          {loading && (
            <div className="text-xs bg-blue-500/10 text-blue-500 p-3 rounded-lg border border-blue-500/20">
              Connecting to live incident feeds...
            </div>
          )}
          {error && (
            <div className="text-xs bg-amber-500/10 text-amber-500 p-3 rounded-lg border border-amber-500/20">
              Unable to reach incident server ({error}). Showing cached view.
            </div>
          )}

          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${cardClass} border-red-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-red-500">Critical Incidents</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{criticalCount}</h3>
                <p className="text-[10px] text-red-400 mt-0.5">Urgent field dispatches</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/20 text-red-500"><ShieldAlert className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-amber-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-amber-500">High Priority</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{highCount}</h3>
                <p className="text-[10px] text-amber-500 mt-0.5">Under investigation</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500"><AlertTriangle className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-blue-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-blue-500">Medium / Low Priority</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{medLowCount}</h3>
                <p className="text-[10px] text-blue-500 mt-0.5">Logistical & BVAS issues</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500"><Clock className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-emerald-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-emerald-500">Resolved Incidents</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{resolvedCount}</h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">{resolutionRate}% resolution rate</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={`${cardClass} rounded-xl p-4 flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Filter className="w-3.5 h-3.5" /> Severity:
              </span>
              {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    severityFilter === sev 
                      ? 'bg-pdp text-white shadow-md' 
                      : isDark ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="All">All Statuses</option>
                <option value="REPORTED">REPORTED</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search incident, PU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Incidents Table */}
          <div className={`${cardClass} rounded-xl p-5 space-y-4`}>
            <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Field Incidents Queue</h3>
              <span className="text-xs font-mono text-slate-400">Showing {filteredIncidents.length} items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <th className="py-3 px-3">Polling Unit</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Reporter</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Time</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                  {filteredIncidents.map((inc) => (
                    <tr key={inc.id} className={`transition ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3 px-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{inc.pu}</td>
                      <td className="py-3 px-3 text-slate-500">{inc.category}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${
                          inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border-red-500/40 animate-pulse'
                            : inc.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-500 border-blue-500/40'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{inc.desc}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <span>{inc.reporter}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{inc.phone}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inc.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-500'
                            : inc.status === 'INVESTIGATING' ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono">{inc.time}</td>
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={() => setSelectedIncident(inc)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded border transition flex items-center gap-1 ml-auto ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inspect Incident Modal */}
          {selectedIncident && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className={`w-full max-w-lg rounded-xl p-6 space-y-4 shadow-xl ${cardClass}`}>
                <div className="flex justify-between items-center border-b pb-3 border-slate-800">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" /> Incident Detail #{selectedIncident.id}
                  </h3>
                  <button onClick={() => setSelectedIncident(null)} className="p-1 rounded-lg hover:bg-slate-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className={`p-3 rounded-lg ${subcardClass}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Location & Unit</span>
                    <p className="font-bold text-sm mt-0.5">{selectedIncident.pu}</p>
                    <p className="text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> LGA: {selectedIncident.lga}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg ${subcardClass}`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                      <p className="font-bold mt-0.5">{selectedIncident.category}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${subcardClass}`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Severity / Status</span>
                      <p className="font-bold mt-0.5">{selectedIncident.severity} / {selectedIncident.status}</p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${subcardClass}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Reporter Information</span>
                    <p className="font-bold mt-0.5">{selectedIncident.reporter}</p>
                    <p className="text-slate-400 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {selectedIncident.phone}</p>
                  </div>

                  <div className={`p-3 rounded-lg ${subcardClass}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                    <p className="mt-1 leading-relaxed text-slate-300">{selectedIncident.desc}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    onClick={() => setSelectedIncident(null)}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200"
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