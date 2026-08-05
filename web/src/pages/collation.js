import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { 
  Building2, 
  Award, 
  FileText, 
  ShieldCheck, 
  Search 
} from 'lucide-react'

export default function CollationCenterPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [selectedLga, setSelectedLga] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const lgaCollationData = [
    { lga: 'Dutse', totalPus: 240, collatedPus: 228, pct: 95, pdp: 78654, apc: 55430, nnpp: 21600, lp: 8620, status: 'Sign-off Ready', ec8c: 'Verified' },
    { lga: 'Hadejia', totalPus: 210, collatedPus: 189, pct: 90, pdp: 65432, apc: 48721, nnpp: 18340, lp: 7100, status: 'Sign-off Ready', ec8c: 'Verified' },
    { lga: 'Kazaure', totalPus: 195, collatedPus: 171, pct: 88, pdp: 62112, apc: 44875, nnpp: 16922, lp: 6420, status: 'In Progress', ec8c: 'Pending Sign-off' },
    { lga: 'Gumel', totalPus: 180, collatedPus: 153, pct: 85, pdp: 54331, apc: 43210, nnpp: 15443, lp: 5310, status: 'In Progress', ec8c: 'Pending Sign-off' },
    { lga: 'Kiyawa', totalPus: 170, collatedPus: 139, pct: 82, pdp: 48231, apc: 36543, nnpp: 14200, lp: 4800, status: 'In Progress', ec8c: 'Pending Sign-off' },
    { lga: 'Jahun', totalPus: 200, collatedPus: 140, pct: 70, pdp: 42100, apc: 38900, nnpp: 12400, lp: 3900, status: 'Flagged Discrepancy', ec8c: 'Under Audit' },
  ]

  const filteredData = lgaCollationData.filter(d => 
    (selectedLga === 'All' || d.lga === selectedLga) &&
    d.lga.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Collation Center & Verification Engine" 
          subtitle="Hierarchical result collation (State -> LGA -> Ward -> Polling Unit) and Form EC8B/EC8C audit" 
        />

        <main className="p-6 space-y-6">
          {/* Top KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Total LGAs Collated</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>22 <span className="text-xs text-emerald-500">(81.5%)</span></h3>
                <p className="text-[10px] text-slate-400 mt-0.5">22 of 27 LGAs completed</p>
              </div>
              <div className="p-3 rounded-xl bg-pdp/20 text-pdp"><Building2 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-emerald-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-emerald-500">PDP Statewide Lead</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>+143,665</h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">PDP 562,430 vs APC 418,765</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500"><Award className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-blue-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-blue-500">EC8B Ward Forms Verified</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>245 / 287</h3>
                <p className="text-[10px] text-blue-500 mt-0.5">85.3% Ward sheets verified</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500"><FileText className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-amber-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-amber-500">EC8C LGA Sign-offs</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>18 LGAs</h3>
                <p className="text-[10px] text-amber-500 mt-0.5">Signed by returning officers</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500"><ShieldCheck className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={`${cardClass} rounded-xl p-4 flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Filter LGA:</span>
              <select 
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="All">All 27 LGAs</option>
                <option value="Dutse">Dutse</option>
                <option value="Hadejia">Hadejia</option>
                <option value="Kazaure">Kazaure</option>
                <option value="Gumel">Gumel</option>
                <option value="Jahun">Jahun</option>
              </select>
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search LGA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Collation Master Table */}
          <div className={`${cardClass} rounded-xl p-5 shadow-sm space-y-4`}>
            <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>LGA Collation Progress & Verification Roster</h3>
              <span className="text-xs font-mono text-slate-400">Showing {filteredData.length} LGAs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <th className="py-3 px-3">LGA</th>
                    <th className="py-3 px-3">Collated Units</th>
                    <th className="py-3 px-3 text-pdp font-bold">PDP Votes</th>
                    <th className="py-3 px-3 text-blue-500 font-bold">APC Votes</th>
                    <th className="py-3 px-3 text-purple-500 font-bold">NNPP Votes</th>
                    <th className="py-3 px-3">Collation %</th>
                    <th className="py-3 px-3">Form EC8C Status</th>
                    <th className="py-3 px-3 text-right">Sign-off Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                  {filteredData.map((d, idx) => (
                    <tr key={idx} className={`transition ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3 px-3 font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.lga}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono">{d.collatedPus} / {d.totalPus} PUs</td>
                      <td className="py-3 px-3 font-extrabold text-pdp text-sm">{d.pdp.toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-blue-500">{d.apc.toLocaleString()}</td>
                      <td className="py-3 px-3 text-purple-500">{d.nnpp.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.pct}%</span>
                          <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div className="bg-pdp h-full rounded-full" style={{ width: `${d.pct}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.ec8c === 'Verified' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        }`}>
                          {d.ec8c}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'Sign-off Ready' ? 'bg-emerald-500/20 text-emerald-500'
                            : d.status === 'Flagged Discrepancy' ? 'bg-red-500/20 text-red-500'
                            : 'bg-amber-500/20 text-amber-500'
                        }`}>
                          {d.status}
                        </span>
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
