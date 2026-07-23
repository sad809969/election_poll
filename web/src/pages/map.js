import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import JigawaMap from '../components/JigawaMap'
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
  FileText, 
  ExternalLink,
  ChevronRight
} from 'lucide-react'

export default function InteractiveMapPage() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedLga, setSelectedLga] = useState('All LGAs')
  const [selectedPu, setSelectedPu] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const lgas = [
    'All LGAs', 'Dutse', 'Hadejia', 'Gumel', 'Kazaure', 'Ringim', 'Birnin Kudu', 
    'Babura', 'Jahun', 'Guri', 'Kaugama', 'Kiyawa', 'Buji', 'Gwaram', 'Gwiwa', 
    'Yankwashi', 'Roni', 'Sule Tankarkar', 'Taura', 'Maigatari', 'Miga', 
    'Malam Madori', 'Kafin Hausa', 'Kirikasamma', 'Auyo', 'Birniwa', 'Gagarawa'
  ]

  const pollingUnits = [
    { id: 'PU 023', name: 'PU 023 - Guri Ward A', lga: 'Guri', ward: 'Guri Ward A', status: 'Attention', agent: 'Murtala A.', phone: '0812 345 6789', registered: 650, incident: 'Minor crowd gathered near entrance', time: '10:40 AM', pdp: 245, apc: 198, verification: 'With EC8A Photo' },
    { id: 'PU 078', name: 'PU 078 - Gumel Central', lga: 'Gumel', ward: 'Gumel Central', status: 'Normal', agent: 'Aisha M.', phone: '0807 111 2233', registered: 580, incident: 'None (BVAS issue resolved)', time: '10:42 AM', pdp: 233, apc: 176, verification: 'With EC8A Photo' },
    { id: 'PU 105', name: 'PU 105 - Hadejia Ward B', lga: 'Hadejia', ward: 'Hadejia Ward B', status: 'Normal', agent: 'Sani R.', phone: '0809 876 5432', status: 'Normal', registered: 620, incident: 'Security presence high', time: '10:38 AM', pdp: 198, apc: 154, verification: 'Pending' },
    { id: 'PU 002', name: 'PU 002 - Jahun Ward A', lga: 'Jahun', ward: 'Jahun Ward A', status: 'Critical', agent: 'Usman K.', phone: '0810 555 1122', registered: 710, incident: 'Violence reported, situation tense', time: '10:35 AM', pdp: 187, apc: 143, verification: 'Pending Verification' },
    { id: 'PU 056', name: 'PU 056 - Kazaure Ward C', lga: 'Kazaure', ward: 'Kazaure Ward C', status: 'Normal', agent: 'Yusuf B.', phone: '0706 111 2233', registered: 520, incident: 'None', time: '10:30 AM', pdp: 176, apc: 132, verification: 'With EC8A Photo' },
    { id: 'PU 012', name: 'PU 012 - Kaugama Ward 1', lga: 'Kaugama', ward: 'Kaugama Ward 1', status: 'Normal', agent: 'Musa A.', phone: '0803 123 4567', registered: 600, incident: 'None', time: '10:45 AM', pdp: 210, apc: 160, verification: 'With EC8A Photo' },
  ]

  const filteredPus = pollingUnits.filter(pu => {
    const matchesStatus = statusFilter === 'All' || pu.status === statusFilter
    const matchesLga = selectedLga === 'All LGAs' || pu.lga === selectedLga
    const matchesSearch = pu.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pu.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pu.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesLga && matchesSearch
  })

  return (
    <div className="flex h-screen bg-[#070D1E] text-slate-100 font-sans overflow-hidden">
      <Sidebar theme="dark" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Interactive Statewide Map" 
          subtitle="Real-time geographic distribution across all 4,827 Polling Units in Jigawa State" 
          theme="dark"
        />

        <main className="p-6 space-y-6">
          {/* Top Controls & Filter Bar */}
          <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status Filter:
              </span>
              {['All', 'Normal', 'Attention', 'Critical', 'No Report'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    statusFilter === status 
                      ? status === 'Critical' ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                        : status === 'Attention' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : status === 'Normal' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-pdp text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {status === 'Normal' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                  {status === 'Attention' && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
                  {status === 'Critical' && <span className="w-2 h-2 rounded-full bg-red-400"></span>}
                  {status === 'No Report' && <span className="w-2 h-2 rounded-full bg-slate-500"></span>}
                  {status}
                </button>
              ))}
            </div>

            {/* LGA Selector & Search Input */}
            <div className="flex items-center gap-3">
              <select 
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg outline-none focus:border-pdp"
              >
                {lgas.map(lga => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search PU code or agent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs outline-none text-slate-200 placeholder-slate-500 focus:border-pdp"
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
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-[#141E38] border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Displayed</span>
                  <span className="text-sm font-extrabold text-white">{filteredPus.length} Units</span>
                </div>
                <div className="bg-[#141E38] border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-emerald-400 font-semibold block">Normal Health</span>
                  <span className="text-sm font-extrabold text-emerald-400">3,812 (79%)</span>
                </div>
                <div className="bg-[#141E38] border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-amber-400 font-semibold block">Attention Required</span>
                  <span className="text-sm font-extrabold text-amber-400">685 (14.2%)</span>
                </div>
                <div className="bg-[#141E38] border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-red-400 font-semibold block">Critical Alert</span>
                  <span className="text-sm font-extrabold text-red-400">156 (3.2%)</span>
                </div>
              </div>
            </div>

            {/* Polling Units Live Stream List (1 Column) */}
            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col h-[420px]">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Filtered Polling Units</h3>
                  <p className="text-[10px] text-slate-500">Click unit to view detail inspector</p>
                </div>
                <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-pdp font-bold">
                  {filteredPus.length} Units
                </span>
              </div>

              <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1">
                {filteredPus.map((pu, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedPu(pu)}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                      selectedPu?.id === pu.id 
                        ? 'bg-pdp/20 border-pdp' 
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          pu.status === 'Critical' ? 'bg-red-500 animate-pulse' 
                            : pu.status === 'Attention' ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}></span>
                        <span className="text-xs font-bold text-white">{pu.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">LGA: {pu.lga} • Agent: {pu.agent}</p>
                      {pu.status !== 'Normal' && (
                        <p className="text-[10px] font-semibold text-amber-400">{pu.incident}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected PU Detail Drawer / Modal */}
          {selectedPu && (
            <div className="bg-[#141E38] border border-pdp rounded-xl p-5 shadow-lg space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      selectedPu.status === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : selectedPu.status === 'Attention' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      STATUS: {selectedPu.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{selectedPu.id}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1">{selectedPu.name}</h3>
                  <p className="text-xs text-slate-400">Ward: {selectedPu.ward} • LGA: {selectedPu.lga} LGA</p>
                </div>
                <button onClick={() => setSelectedPu(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block">ASSIGNED AGENT</span>
                  <span className="font-extrabold text-white text-sm block mt-0.5">{selectedPu.agent}</span>
                  <span className="text-[10px] text-pdp font-mono flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {selectedPu.phone}
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block">REGISTERED VOTERS</span>
                  <span className="font-extrabold text-white text-sm block mt-0.5">{selectedPu.registered} Voters</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Check-in: 08:15 AM</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block">VOTE RESULT (PDP / APC)</span>
                  <span className="font-extrabold text-emerald-400 text-sm block mt-0.5">PDP: {selectedPu.pdp} votes</span>
                  <span className="text-[10px] text-blue-400 block mt-1">APC: {selectedPu.apc} votes</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block">EC8A PROOF VERIFICATION</span>
                  <span className="font-extrabold text-white text-xs block mt-0.5">{selectedPu.verification}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Last Update: {selectedPu.time}</span>
                </div>
              </div>

              {selectedPu.status !== 'Normal' && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-red-300">Active Incident Flag: {selectedPu.incident}</p>
                      <p className="text-[10px] text-red-400">Reported at {selectedPu.time} by {selectedPu.agent}</p>
                    </div>
                  </div>
                  <button className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                    Dispatch Situation Team
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
