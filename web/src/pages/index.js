import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import JigawaMap from '../components/JigawaMap'
import { 
  Building2, 
  Users, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ShieldAlert
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts'

export default function DarkMonitoringDashboard() {
  const [theme, setTheme] = useState('dark')

  // Sample chart data matching mockup
  const timelineData = [
    { time: '6AM', reports: 120 },
    { time: '8AM', reports: 450 },
    { time: '10AM', reports: 720 },
    { time: '12PM', reports: 980 },
    { time: '2PM', reports: 850 },
    { time: '4PM', reports: 610 },
    { time: '6PM', reports: 340 },
  ]

  const incidentPieData = [
    { name: 'Violence', value: 42, color: '#EF4444' },
    { name: 'Intimidation', value: 31, color: '#F59E0B' },
    { name: 'BVAS Issues', value: 28, color: '#3B82F6' },
    { name: 'Vote Buying', value: 21, color: '#10B981' },
    { name: 'Ballot Shortage', value: 18, color: '#8B5CF6' },
    { name: 'Others', value: 16, color: '#64748B' },
  ]

  const recentReports = [
    { pu: 'PU 012, Kaugama LGA', msg: 'Voting in progress smoothly', time: '10:45 AM', agent: 'Musa A.', status: 'Normal' },
    { pu: 'PU 078, Gumel LGA', msg: 'BVAS malfunction resolved', time: '10:42 AM', agent: 'Aisha M.', status: 'Normal' },
    { pu: 'PU 023, Guri LGA', msg: 'Minor crowd at the unit', time: '10:40 AM', agent: 'Ibrahim Y.', status: 'Attention' },
    { pu: 'PU 105, Hadejia LGA', msg: 'Security presence is high', time: '10:38 AM', agent: 'Sani R.', status: 'Normal' },
    { pu: 'PU 002, Jahun LGA', msg: 'Violence reported, situation tense', time: '10:35 AM', agent: 'Usman K.', status: 'Critical' },
  ]

  const topLgas = [
    { name: 'Kazaure', pct: 98 },
    { name: 'Gumel', pct: 96 },
    { name: 'Hadejia', pct: 95 },
    { name: 'Guri', pct: 93 },
    { name: 'Dutse', pct: 91 },
  ]

  return (
    <div className="flex h-screen bg-[#070D1E] text-slate-100 font-sans overflow-hidden">
      <Sidebar theme="dark" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Dashboard" 
          subtitle="Overview of election activities across Jigawa State" 
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />

        <main className="p-6 space-y-6">
          {/* Top Date & Election Banner */}
          <div className="flex justify-between items-center bg-[#141E38] border border-slate-800 rounded-xl px-5 py-3 shadow-sm">
            <div>
              <span className="text-xs text-slate-400 font-semibold">Jigawa State PDP Election Command Center</span>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Governorship Election Situation Room</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">LIVE FEED</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300">
              <Clock className="w-4 h-4 text-pdp" />
              <span>Election Date: <strong className="text-white">Sat, 20th April 2027</strong></span>
            </div>
          </div>

          {/* 5 Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Total Polling Units</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Building2 className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-white">4,827</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Across 27 LGAs</p>
              </div>
            </div>

            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Active Agents</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Users className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-white">4,512</h3>
                <p className="text-[10px] text-emerald-400 mt-0.5">93.5% of total agents</p>
              </div>
            </div>

            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Reports Received</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><FileText className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-white">2,842</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Today, 20th Apr 2027</p>
              </div>
            </div>

            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Incidents Reported</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><AlertTriangle className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-white">156</h3>
                <p className="text-[10px] text-amber-400 mt-0.5">Today, 20th Apr 2027</p>
              </div>
            </div>

            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Pending Reports</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400"><Clock className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-white">315</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">From 289 Polling Units</p>
              </div>
            </div>
          </div>

          {/* Map + Recent Reports Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <JigawaMap />
            </div>

            {/* Recent Reports List */}
            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col h-[320px]">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300">Recent Field Reports</span>
                <button className="text-[10px] font-semibold text-pdp hover:underline">View All</button>
              </div>
              <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1">
                {recentReports.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          item.status === 'Critical' ? 'bg-red-500' : item.status === 'Attention' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                        <span className="text-xs font-bold text-slate-200 truncate">{item.pu}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.msg}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono block">{item.time}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Agent: {item.agent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Analytics 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Reports Over Time (Line Chart) */}
            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[280px]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Reports Over Time (Today)</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Peak: 12PM
                </span>
              </div>
              <div className="h-[200px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="reports" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorReports)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incidents by Type (Donut Chart) */}
            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[280px]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Incidents by Type (Today)</span>
                <span className="text-[10px] text-slate-400">Total: 156</span>
              </div>
              <div className="flex items-center justify-between h-[200px] px-2">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={incidentPieData} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                        {incidentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-1.5 text-[10px]">
                  {incidentPieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-300">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-100">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top LGAs Coverage + Critical Alert */}
            <div className="bg-[#141E38] border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-[280px]">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-300">Top LGAs by Coverage</span>
                  <span className="text-[10px] font-semibold text-pdp">View All</span>
                </div>
                <div className="space-y-2.5">
                  {topLgas.map((lga, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-300">{lga.name}</span>
                        <span className="text-emerald-400">{lga.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${lga.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Alert Sub-card */}
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-300">22 Critical Incidents</p>
                    <p className="text-[9px] text-red-400/80">Require immediate situation room dispatch</p>
                  </div>
                </div>
                <button className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded transition">
                  Dispatch
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
