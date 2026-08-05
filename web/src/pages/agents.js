import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { 
  Users, 
  ShieldCheck, 
  Phone, 
  Search, 
  Filter, 
  Upload, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react'

export default function AgentsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [statusFilter, setStatusFilter] = useState('All')
  const [lgaFilter, setLgaFilter] = useState('All LGAs')
  const [searchQuery, setSearchQuery] = useState('')

  const agentsList = [
    { id: 1, name: 'Murtala A.', role: 'Polling Unit Agent', pu: 'PU 023 - Guri Ward A', puCode: 'PU 023', lga: 'Guri', ward: 'Guri Ward A', phone: '0812 345 6789', status: 'Online', battery: '92%', network: '4G LTE', lastActive: '2 mins ago' },
    { id: 2, name: 'Aisha M.', role: 'Polling Unit Agent', pu: 'PU 078 - Gumel Central', puCode: 'PU 078', lga: 'Gumel', ward: 'Gumel Central', phone: '0807 111 2233', status: 'Online', battery: '85%', network: '4G LTE', lastActive: 'Just now' },
    { id: 3, name: 'Sani R.', role: 'Polling Unit Agent', pu: 'PU 105 - Hadejia Ward B', puCode: 'PU 105', lga: 'Hadejia', ward: 'Hadejia Ward B', phone: '0809 876 5432', status: 'Online', battery: '78%', network: '3G', lastActive: '5 mins ago' },
    { id: 4, name: 'Usman K.', role: 'Polling Unit Agent', pu: 'PU 002 - Jahun Ward A', puCode: 'PU 002', lga: 'Jahun', ward: 'Jahun Ward A', phone: '0810 555 1122', status: 'Offline', battery: '15%', network: 'No Service', lastActive: '45 mins ago' },
    { id: 5, name: 'Yusuf B.', role: 'Polling Unit Agent', pu: 'PU 056 - Kazaure Ward C', puCode: 'PU 056', lga: 'Kazaure', ward: 'Kazaure Ward C', phone: '0706 111 2233', status: 'Online', battery: '95%', network: '4G LTE', lastActive: '1 min ago' },
    { id: 6, name: 'Musa A.', role: 'Polling Unit Agent', pu: 'PU 012 - Kaugama Ward 1', puCode: 'PU 012', lga: 'Kaugama', ward: 'Kaugama Ward 1', phone: '0803 123 4567', status: 'Online', battery: '88%', network: '4G LTE', lastActive: '3 mins ago' },
  ]

  const filteredAgents = agentsList.filter(agent => {
    const matchesStatus = statusFilter === 'All' || agent.status === statusFilter
    const matchesLga = lgaFilter === 'All LGAs' || agent.lga === lgaFilter
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          agent.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.puCode.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesLga && matchesSearch
  })

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Agent Management & Field Tracking" 
          subtitle="Real-time connectivity monitoring and exclusive polling unit agent directory" 
        />

        <main className="p-6 space-y-6">
          {/* Top 4 Gauge Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Total Authorized Agents</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>4,827</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">1 Agent per Polling Unit</p>
              </div>
              <div className="p-3 rounded-xl bg-pdp/20 text-pdp"><Users className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-emerald-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-emerald-500">Online & Connected</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>4,212 <span className="text-xs text-emerald-500">(87.2%)</span></h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">Active WebSocket telemetry</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-rose-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-rose-500">Offline / Queue Mode</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>615 <span className="text-xs text-rose-500">(12.8%)</span></h3>
                <p className="text-[10px] text-rose-500 mt-0.5">Saving reports locally</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-500"><XCircle className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Excel Agent Import</span>
                <button className="mt-2 bg-pdp hover:bg-pdp-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Import Agents
                </button>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500"><ShieldCheck className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={`${cardClass} rounded-xl p-4 flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Filter className="w-3.5 h-3.5" /> Filter Status:
              </span>
              {['All', 'Online', 'Offline'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === st 
                      ? 'bg-pdp text-white shadow-md' 
                      : isDark ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-slate-100 text-slate-600 border border-slate-200'
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
                className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="All LGAs">All LGAs</option>
                <option value="Dutse">Dutse</option>
                <option value="Hadejia">Hadejia</option>
                <option value="Gumel">Gumel</option>
                <option value="Guri">Guri</option>
                <option value="Kazaure">Kazaure</option>
              </select>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search agent name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Agents Grid Table */}
          <div className={`${cardClass} rounded-xl p-5 shadow-sm space-y-4`}>
            <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Field Agent Telemetry Roster</h3>
              <span className="text-xs font-mono text-slate-400">Showing {filteredAgents.length} Agents</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <th className="py-3 px-3">Agent Name</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Assigned Polling Unit</th>
                    <th className="py-3 px-3">LGA</th>
                    <th className="py-3 px-3">Phone Number</th>
                    <th className="py-3 px-3">Device & Network</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Last Active</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                  {filteredAgents.map((ag) => (
                    <tr key={ag.id} className={`transition ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3 px-3 font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${ag.status === 'Online' ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                        <span>{ag.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{ag.role}</td>
                      <td className={`py-3 px-3 font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{ag.pu}</td>
                      <td className="py-3 px-3 text-slate-400">{ag.lga}</td>
                      <td className="py-3 px-3 text-pdp font-mono">{ag.phone}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        <span>{ag.battery}</span> • <span>{ag.network}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ag.status === 'Online' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                        }`}>
                          {ag.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono">{ag.lastActive}</td>
                      <td className="py-3 px-3 text-right">
                        <button className="bg-pdp hover:bg-pdp-dark text-white text-[10px] font-bold px-2.5 py-1 rounded transition flex items-center gap-1 ml-auto">
                          <Phone className="w-3 h-3" /> Call Agent
                        </button>
                      </td>
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
