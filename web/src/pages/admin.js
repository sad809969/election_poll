import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import { 
  Users, 
  UserCheck, 
  Building2, 
  MapPin, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Shield,
  FileSpreadsheet
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts'

export default function AdminPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [lgaFilter, setLgaFilter] = useState('All LGAs')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [liveUsers, setLiveUsers] = useState([])

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await apiFetch('/agents');
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((u, i) => ({
            id: u.id || i + 1,
            name: u.full_name || u.username,
            username: u.username,
            role: u.role || 'Polling Unit Agent',
            roleBadge: u.role === 'Super Admin' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 text-slate-400',
            lga: u.lga_name || 'Jigawa State',
            phone: u.phone_number || '0800 000 0000',
            status: u.is_active ? 'Active' : 'Inactive',
            lastLogin: 'Today'
          }));
          setLiveUsers(mapped);
        }
      } catch (e) {
        console.error('Failed to load admin users:', e);
      }
    }
    loadUsers();
  }, []);

  const fallbackUsersList = [
    { id: 1, name: 'Abdullahi Usman', username: 'admin', role: 'Super Admin', roleBadge: 'bg-emerald-500/20 text-emerald-500', lga: 'Jigawa State', phone: '0803 123 4567', status: 'Active', lastLogin: 'Today, 08:45 AM' },
    { id: 2, name: 'Musa Kiyawa', username: 'statechairman', role: 'State Chairman', roleBadge: 'bg-blue-500/20 text-blue-500', lga: 'Jigawa State', phone: '0802 987 6543', status: 'Active', lastLogin: 'Today, 07:32 AM' },
    { id: 3, name: 'Aliyu A. Babura', username: 'dg', role: 'Director General', roleBadge: 'bg-purple-500/20 text-purple-500', lga: 'Jigawa State', phone: '0806 555 1234', status: 'Active', lastLogin: 'Today, 09:12 AM' },
    { id: 4, name: 'Murtala A. Guri', username: 'guri_coord', role: 'LGA Coordinator', roleBadge: 'bg-amber-500/20 text-amber-500', lga: 'Guri LGA', phone: '0812 345 6789', status: 'Active', lastLogin: 'Today, 10:15 AM' },
    { id: 5, name: 'Aisha Muhammad', username: 'gumel_agent', role: 'Polling Unit Agent', roleBadge: 'bg-slate-500/20 text-slate-400', lga: 'Gumel (PU 078)', phone: '0807 111 2233', status: 'Active', lastLogin: 'Today, 10:42 AM' },
    { id: 6, name: 'Ibrahim Y. Dutse', username: 'dutse_coord', role: 'Ward Coordinator', roleBadge: 'bg-indigo-500/20 text-indigo-500', lga: 'Dutse Central', phone: '0703 444 5566', status: 'Inactive', lastLogin: 'Yesterday, 04:20 PM' },
  ]

  const usersList = liveUsers.length > 0 ? liveUsers : fallbackUsersList

  const roleDistribution = [
    { name: 'Polling Unit Agents', value: 3912, pct: '69.2%', color: '#EF4444' },
    { name: 'Ward Coordinators', value: 287, pct: '5.1%', color: '#3B82F6' },
    { name: 'LGA Coordinators', value: 27, pct: '0.5%', color: '#F59E0B' },
    { name: 'Situation Room Officers', value: 68, pct: '1.2%', color: '#10B981' },
    { name: 'Others', value: 954, pct: '24.0%', color: '#64748B' },
  ]

  const filteredUsers = usersList.filter(user => {
    const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter
    const matchesStatus = statusFilter === 'All Status' || user.status === statusFilter
    const matchesLga = lgaFilter === 'All LGAs' || user.lga.includes(lgaFilter)
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.phone.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesStatus && matchesLga && matchesSearch
  })

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Admin Dashboard" 
          subtitle="Administrative and technical control center" 
        />

        <main className="p-6 space-y-6">
          {/* Top 5 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex flex-col justify-between`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Total Users</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Users className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>1,248</h3>
                <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">↗ + 12.5% from last month</p>
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex flex-col justify-between`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Active Agents</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><UserCheck className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>3,912</h3>
                <p className="text-[10px] text-blue-500 font-semibold mt-0.5">↗ + 18.3% from last month</p>
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex flex-col justify-between`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Total Polling Units</span>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Building2 className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>4,827</h3>
                <p className="text-[10px] text-purple-500 font-semibold mt-0.5">↗ + 9.7% from last month</p>
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex flex-col justify-between`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Total LGAs</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><MapPin className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>27</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">No change</p>
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex flex-col justify-between`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">Total Wards</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500"><Shield className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <h3 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>287</h3>
                <p className="text-[10px] text-rose-500 font-semibold mt-0.5">↗ + 2.1% from last month</p>
              </div>
            </div>
          </div>

          {/* User Management Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Table (2 Columns) */}
            <div className={`lg:col-span-2 ${cardClass} rounded-xl p-5 space-y-4`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>User Management</h3>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="bg-pdp hover:bg-pdp-dark text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer relative z-10"
                >
                  <Plus className="w-4 h-4" /> Add New User
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="All Roles">All Roles</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="State Chairman">State Chairman</option>
                  <option value="Director General">Director General</option>
                  <option value="LGA Coordinator">LGA Coordinator</option>
                  <option value="Polling Unit Agent">Polling Unit Agent</option>
                </select>

                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="All Status">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">LGA / Ward / PU</th>
                      <th className="py-2.5 px-3">Phone Number</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Last Login</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className={`transition ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                        <td className={`py-3 px-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.name}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">{u.username}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.roleBadge}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{u.lga}</td>
                        <td className="py-3 px-3 text-pdp font-mono">{u.phone}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'Active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">{u.lastLogin}</td>
                        <td className="py-3 px-3 text-right">
                          <button className="text-slate-400 hover:text-pdp p-1">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role Distribution Donut Chart (1 Column) */}
            <div className={`${cardClass} rounded-xl p-5 space-y-4 flex flex-col justify-between`}>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>User Role Distribution</h3>
                <div className="h-[220px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={roleDistribution} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                        {roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-xs pt-2">
                  {roleDistribution.map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{r.name}</span>
                      </div>
                      <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.value.toLocaleString()} ({r.pct})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${cardClass} w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Plus className="w-4 h-4 text-pdp" /> Add New System User
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              try {
                await apiFetch('/agents', {
                  method: 'POST',
                  body: JSON.stringify({
                    full_name: form.full_name.value,
                    username: form.username.value,
                    password: form.password.value,
                    role: form.role.value,
                    phone_number: form.phone_number.value
                  })
                });
                alert('User created successfully!');
                setShowAddModal(false);
                window.location.reload();
              } catch (err) {
                alert('Error creating user: ' + err.message);
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-400">Full Name</label>
                <input required name="full_name" type="text" placeholder="e.g. Murtala Abubakar" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Username</label>
                <input required name="username" type="text" placeholder="e.g. murtala_guri" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Password</label>
                <input required name="password" type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Authorization Role (9 Tiers)</label>
                <select name="role" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none">
                  <option value="Super Admin">Super Admin</option>
                  <option value="State Chairman">State Chairman</option>
                  <option value="Governorship Candidate">Governorship Candidate</option>
                  <option value="Deputy Governorship Candidate">Deputy Governorship Candidate</option>
                  <option value="Director General">Director General</option>
                  <option value="Situation Room Officer">Situation Room Officer</option>
                  <option value="LGA Coordinator">LGA Coordinator</option>
                  <option value="Ward Coordinator">Ward Coordinator</option>
                  <option value="Polling Unit Agent">Polling Unit Agent</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Phone Number</label>
                <input name="phone_number" type="text" placeholder="0812 345 6789" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-pdp text-white font-bold rounded-lg hover:bg-pdp-dark">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
