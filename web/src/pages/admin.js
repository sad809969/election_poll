import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  Users, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Layers, 
  Plus, 
  Upload, 
  Search, 
  Eye, 
  Edit3, 
  MoreVertical,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Settings,
  Activity,
  ArrowUpRight
} from 'lucide-react'
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const [theme, setTheme] = useState('light')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  const roleDistribution = [
    { name: 'Polling Unit Agents', value: 3912, pct: '69.2%', color: '#EF4444' },
    { name: 'Ward Coordinators', value: 287, pct: '5.1%', color: '#3B82F6' },
    { name: 'LGA Coordinators', value: 27, pct: '0.5%', color: '#F59E0B' },
    { name: 'Situation Room Officers', value: 68, pct: '1.2%', color: '#10B981' },
    { name: 'Others', value: 954, pct: '24.0%', color: '#64748B' },
  ]

  const usersList = [
    { name: 'Abdullahi Usman', username: 'admin', role: 'Super Admin', scope: 'Jigawa State', phone: '0803 123 4567', status: 'Active', login: 'Today, 08:45 AM', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { name: 'Musa Kiyawa', username: 'statechairman', role: 'State Chairman', scope: 'Jigawa State', phone: '0802 987 6543', status: 'Active', login: 'Today, 07:32 AM', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { name: 'Aliyu A. Babura', username: 'dg', role: 'Director General', scope: 'Jigawa State', phone: '0806 555 7788', status: 'Active', login: 'Today, 06:15 AM', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { name: 'Ibrahim B. Gumel', username: 'lgacoord_gumel', role: 'LGA Coordinator', scope: 'Gumel LGA', phone: '0701 234 5678', status: 'Active', login: 'Today, 05:40 AM', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { name: 'Sani R. Hadejia', username: 'wardcoord_02', role: 'Ward Coordinator', scope: 'Hadejia LGA / Ward 2', phone: '0809 876 5432', status: 'Active', login: 'Today, 05:10 AM', color: 'bg-teal-100 text-teal-700 border-teal-300' },
    { name: 'Murtala A.', username: 'agent_pu_023', role: 'Polling Unit Agent', scope: 'Guri LGA / Ward A / PU 023', phone: '0812 345 6789', status: 'Active', login: 'Today, 04:55 AM', color: 'bg-rose-100 text-rose-700 border-rose-300' },
    { name: 'Yusuf Usman', username: 'sroom_officer1', role: 'Situation Room Officer', scope: 'Jigawa State', phone: '0810 555 1122', status: 'Inactive', login: 'Yesterday, 11:20 PM', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    { name: 'Aisha Bello', username: 'wardcoord_05', role: 'Ward Coordinator', scope: 'Kazaure LGA / Ward 5', phone: '0706 111 2233', status: 'Active', login: 'Yesterday, 10:05 PM', color: 'bg-teal-100 text-teal-700 border-teal-300' },
  ]

  const recentActivities = [
    { title: 'New agent import completed', desc: '512 agents imported successfully', time: '10:30 AM', icon: FileSpreadsheet },
    { title: 'User Musa Kiyawa logged in', desc: 'State Chairman session active', time: '09:15 AM', icon: Users },
    { title: 'Polling Unit added', desc: 'PU 045 - Gagarawa Ward C', time: 'Yesterday', icon: Building2 },
    { title: 'Announcement sent', desc: 'Election Day Guidelines', time: 'Yesterday', icon: Activity },
  ]

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar theme="light" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Admin Dashboard" 
          subtitle="Administrative and technical control center" 
          theme="light" 
        />

        <main className="p-6 space-y-6">
          {/* Top 5 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-pdp"><Users className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-500">Total Users</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">1,248</h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> ↑ 12.5% from last month
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600"><ShieldCheck className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-500">Active Agents</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">3,912</h3>
                <p className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> ↑ 18.3% from last month
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600"><Building2 className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-500">Total Polling Units</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">4,827</h3>
                <p className="text-[10px] text-purple-600 font-semibold mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> ↑ 9.7% from last month
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600"><MapPin className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-500">Total LGAs</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">27</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">No change</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600"><Layers className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-500">Total Wards</span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">287</h3>
                <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> ↑ 2.1% from last month
                </p>
              </div>
            </div>
          </div>

          {/* User Management & Right Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Table Column */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">User Management</h2>
                <button className="bg-pdp hover:bg-pdp-dark text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm">
                  <Plus className="w-4 h-4" /> Add New User
                </button>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <select className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 outline-none text-slate-700 font-medium">
                    <option>All Roles</option>
                    <option>Super Admin</option>
                    <option>State Chairman</option>
                    <option>LGA Coordinator</option>
                    <option>Polling Unit Agent</option>
                  </select>
                  <select className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 outline-none text-slate-700 font-medium">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                  <select className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 outline-none text-slate-700 font-medium">
                    <option>All LGAs</option>
                    <option>Dutse</option>
                    <option>Gumel</option>
                    <option>Hadejia</option>
                  </select>
                </div>

                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold">
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">LGA / Ward / PU</th>
                      <th className="py-2.5 px-3">Phone Number</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Last Login</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((user, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center text-slate-700">
                            {user.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <span>{user.name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">{user.username}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.color}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">{user.scope}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono">{user.phone}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{user.login}</td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"><MoreVertical className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column (Role Chart & Stats) */}
            <div className="space-y-6">
              {/* Role Distribution Donut Chart */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">User Role Distribution</h3>
                <div className="h-[180px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={roleDistribution} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                        {roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-xs">
                  {roleDistribution.map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                        <span className="text-slate-600 font-medium text-[11px]">{r.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 text-[11px]">{r.value.toLocaleString()} ({r.pct})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900">Recent Activities</h3>
                  <button className="text-[10px] text-pdp font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {recentActivities.map((act, idx) => {
                    const Icon = act.icon
                    return (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <div className="p-2 rounded-lg bg-emerald-50 text-pdp flex-shrink-0"><Icon className="w-3.5 h-3.5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{act.title}</p>
                          <p className="text-[10px] text-slate-400">{act.desc}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Launchers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Agent Import (Excel)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Bulk upload agent credentials via CSV</p>
                <button className="mt-3 bg-pdp hover:bg-pdp-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" /> Import Agents
                </button>
              </div>
              <FileSpreadsheet className="w-12 h-12 text-emerald-500/20" />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Polling Unit Management</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Configure 4,827 PUs & boundaries</p>
                <button className="mt-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                  <Building2 className="w-3.5 h-3.5" /> Manage Polling Units
                </button>
              </div>
              <Building2 className="w-12 h-12 text-blue-500/20" />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">System Settings</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Security, JWT & backup preferences</p>
                <button className="mt-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                  <Settings className="w-3.5 h-3.5" /> System Settings
                </button>
              </div>
              <Settings className="w-12 h-12 text-slate-500/20" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
