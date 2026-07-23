import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react'

export default function PollingUnitsPage() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [lgaFilter, setLgaFilter] = useState('All LGAs')
  const [searchQuery, setSearchQuery] = useState('')

  const pollingUnits = [
    { id: 1, code: 'PU 023', name: 'PU 023 - Guri Ward A', lga: 'Guri', ward: 'Guri Ward A', voters: 650, status: 'Attention', agent: 'Murtala A.', lat: 27.02, lng: 12.34, resultStatus: 'Submitted (PDP Lead)' },
    { id: 2, code: 'PU 078', name: 'PU 078 - Gumel Central', lga: 'Gumel', ward: 'Gumel Central', voters: 580, status: 'Normal', agent: 'Aisha M.', lat: 27.12, lng: 12.45, resultStatus: 'Submitted (PDP Lead)' },
    { id: 3, code: 'PU 105', name: 'PU 105 - Hadejia Ward B', lga: 'Hadejia', ward: 'Hadejia Ward B', voters: 620, status: 'Normal', agent: 'Sani R.', lat: 27.20, lng: 12.50, resultStatus: 'Pending Result' },
    { id: 4, code: 'PU 002', name: 'PU 002 - Jahun Ward A', lga: 'Jahun', ward: 'Jahun Ward A', voters: 710, status: 'Critical', agent: 'Usman K.', lat: 27.05, lng: 12.15, resultStatus: 'Flagged Incident' },
    { id: 5, code: 'PU 056', name: 'PU 056 - Kazaure Ward C', lga: 'Kazaure', ward: 'Kazaure Ward C', voters: 520, status: 'Normal', agent: 'Yusuf B.', lat: 27.30, lng: 12.60, resultStatus: 'Submitted (PDP Lead)' },
    { id: 6, code: 'PU 012', name: 'PU 012 - Kaugama Ward 1', lga: 'Kaugama', ward: 'Kaugama Ward 1', voters: 600, status: 'Normal', agent: 'Musa A.', lat: 27.40, lng: 12.70, resultStatus: 'Submitted (PDP Lead)' },
  ]

  const filteredPus = pollingUnits.filter(pu => {
    const matchesStatus = statusFilter === 'All' || pu.status === statusFilter
    const matchesLga = lgaFilter === 'All LGAs' || pu.lga === lgaFilter
    const matchesSearch = pu.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pu.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pu.agent.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesLga && matchesSearch
  })

  return (
    <div className="flex h-screen bg-[#070D1E] text-slate-100 font-sans overflow-hidden">
      <Sidebar theme="dark" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Polling Units Directory" 
          subtitle="Electoral boundary management across all 4,827 Polling Units in Jigawa State" 
          theme="dark"
        />

        <main className="p-6 space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400">Total Polling Units</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">4,827</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">27 LGAs • 287 Wards</p>
              </div>
              <div className="p-3 rounded-xl bg-pdp/20 text-pdp"><Building2 className="w-6 h-6" /></div>
            </div>

            <div className="bg-[#141E38] border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-emerald-400">Normal Health Status</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">3,812</h3>
                <p className="text-[10px] text-emerald-400 mt-0.5">79.0% operating smoothly</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400"><CheckCircle2 className="w-6 h-6" /></div>
            </div>

            <div className="bg-[#141E38] border border-amber-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-amber-400">Attention Required</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">685</h3>
                <p className="text-[10px] text-amber-400 mt-0.5">14.2% crowding or BVAS delay</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400"><AlertTriangle className="w-6 h-6" /></div>
            </div>

            <div className="bg-[#141E38] border border-red-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-red-400">Critical Incidents</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">156</h3>
                <p className="text-[10px] text-red-400 mt-0.5">3.2% high risk units</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/20 text-red-400"><AlertTriangle className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {['All', 'Normal', 'Attention', 'Critical'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === st 
                      ? 'bg-pdp text-white shadow-md' 
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <select 
                value={lgaFilter}
                onChange={(e) => setLgaFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg outline-none"
              >
                <option value="All LGAs">All LGAs</option>
                <option value="Dutse">Dutse</option>
                <option value="Hadejia">Hadejia</option>
                <option value="Gumel">Gumel</option>
                <option value="Guri">Guri</option>
                <option value="Kazaure">Kazaure</option>
                <option value="Jahun">Jahun</option>
              </select>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search unit code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs outline-none text-slate-200 placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Polling Units Table */}
          <div className="bg-[#141E38] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200">Polling Unit Master Directory</h3>
              <span className="text-xs font-mono text-slate-400">Showing {filteredPus.length} Units</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-y border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-3">PU Code</th>
                    <th className="py-3 px-3">Polling Unit Name</th>
                    <th className="py-3 px-3">Ward</th>
                    <th className="py-3 px-3">LGA</th>
                    <th className="py-3 px-3">Registered Voters</th>
                    <th className="py-3 px-3">Assigned Agent</th>
                    <th className="py-3 px-3">Health Status</th>
                    <th className="py-3 px-3 text-right">Result Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {filteredPus.map((pu) => (
                    <tr key={pu.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-3 font-mono font-extrabold text-pdp">{pu.code}</td>
                      <td className="py-3 px-3 font-bold text-white">{pu.name}</td>
                      <td className="py-3 px-3 text-slate-300">{pu.ward}</td>
                      <td className="py-3 px-3 text-slate-400">{pu.lga}</td>
                      <td className="py-3 px-3 text-slate-200 font-bold">{pu.voters} Voters</td>
                      <td className="py-3 px-3 text-slate-300">
                        <span>{pu.agent}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pu.status === 'Critical' ? 'bg-red-500/20 text-red-400'
                            : pu.status === 'Attention' ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {pu.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">{pu.resultStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
