import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { 
  BarChart3, 
  CheckCircle2, 
  FileText, 
  Download, 
  Building2, 
  Search, 
  Filter, 
  ShieldAlert, 
  Eye 
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts'

export default function ResultsDashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [selectedLga, setSelectedLga] = useState('All LGAs')
  const [searchQuery, setSearchQuery] = useState('')

  const partyVoteShare = [
    { name: 'PDP (Peoples Democratic Party)', votes: 562430, pct: '52.4%', color: '#10B981' },
    { name: 'APC (All Progressives Congress)', votes: 418765, pct: '39.0%', color: '#3B82F6' },
    { name: 'NNPP (New Nigeria Peoples Party)', votes: 68420, pct: '6.4%', color: '#8B5CF6' },
    { name: 'LP (Labour Party)', votes: 23640, pct: '2.2%', color: '#F59E0B' },
  ]

  const lgaCollationTable = [
    { lga: 'Dutse', totalPus: 240, collatedPus: 228, pdp: 78654, apc: 55430, nnpp: 21600, lp: 8620, pct: '95%' },
    { lga: 'Hadejia', totalPus: 210, collatedPus: 189, pdp: 65432, apc: 48721, nnpp: 18340, lp: 7100, pct: '90%' },
    { lga: 'Kazaure', totalPus: 195, collatedPus: 171, pdp: 62112, apc: 44875, nnpp: 16922, lp: 6420, pct: '88%' },
    { lga: 'Gumel', totalPus: 180, collatedPus: 153, pdp: 54331, apc: 43210, nnpp: 15443, lp: 5310, pct: '85%' },
    { lga: 'Kiyawa', totalPus: 170, collatedPus: 139, pdp: 48231, apc: 36543, nnpp: 14200, lp: 4800, pct: '82%' },
  ]

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Results Dashboard & Collation Engine" 
          subtitle="Real-time vote collation, EC8A proof verification, and candidate vote share analytics" 
        />

        <main className="p-6 space-y-6">
          {/* Top 4 KPI Banner Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Total Collated Votes</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>1,073,255</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">From 3,928 Polling Units</p>
              </div>
              <div className="p-3 rounded-xl bg-pdp/20 text-pdp"><BarChart3 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-emerald-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-emerald-500">PDP Total Votes</span>
                <h3 className={`text-2xl font-extrabold text-emerald-500 mt-1`}>562,430 <span className="text-xs font-bold">(52.4%)</span></h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">Lead margin: +143,665</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-blue-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-blue-500">APC Total Votes</span>
                <h3 className={`text-2xl font-extrabold text-blue-500 mt-1`}>418,765 <span className="text-xs font-bold">(39.0%)</span></h3>
                <p className="text-[10px] text-blue-500 mt-0.5">Runner-up party</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500"><Building2 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-purple-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-purple-500">EC8A Proof Verification</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>3,812 / 4,827</h3>
                <p className="text-[10px] text-purple-500 mt-0.5">79.0% result sheets uploaded</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-500"><FileText className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Party Vote Share + LGA Collation Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart (1 Column) */}
            <div className={`${cardClass} rounded-xl p-5 space-y-4 flex flex-col justify-between`}>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Statewide Party Vote Share</h3>
                <div className="h-[200px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={partyVoteShare} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="votes">
                        {partyVoteShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-xs pt-2">
                  {partyVoteShare.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{p.name}</span>
                      </div>
                      <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.votes.toLocaleString()} ({p.pct})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LGA Collation Table (2 Columns) */}
            <div className={`lg:col-span-2 ${cardClass} rounded-xl p-5 space-y-4`}>
              <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>27 LGA Collation Breakdown</h3>
                <button className="bg-pdp hover:bg-pdp-dark text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Export PDF Report
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      <th className="py-2.5 px-3">LGA</th>
                      <th className="py-2.5 px-3">Collated PUs</th>
                      <th className="py-2.5 px-3 text-emerald-500 font-bold">PDP Votes</th>
                      <th className="py-2.5 px-3 text-blue-500 font-bold">APC Votes</th>
                      <th className="py-2.5 px-3 text-purple-500 font-bold">NNPP Votes</th>
                      <th className="py-2.5 px-3">Collation %</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                    {lgaCollationTable.map((l, idx) => (
                      <tr key={idx} className={`transition ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                        <td className={`py-3 px-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{l.lga}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono">{l.collatedPus} / {l.totalPus}</td>
                        <td className="py-3 px-3 font-extrabold text-emerald-500">{l.pdp.toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold text-blue-500">{l.apc.toLocaleString()}</td>
                        <td className="py-3 px-3 text-purple-500">{l.nnpp.toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold font-mono">{l.pct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
