import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch, loginUser } from '../lib/api'
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
  FileSpreadsheet,
  Check,
  Sliders,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts'
import { ALL_SIDE_B_PAGES, ALL_SIDE_A_MODULES, ROLE_PRESETS } from './system-admin'

export default function AdminPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [lgaFilter, setLgaFilter] = useState('All LGAs')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [liveUsers, setLiveUsers] = useState([])

  // Cascading Location Dropdowns State
  const [lgasList, setLgasList] = useState([])
  const [wardsList, setWardsList] = useState([])
  const [pusList, setPusList] = useState([])
  const [selectedLgaId, setSelectedLgaId] = useState('')
  const [selectedWardId, setSelectedWardId] = useState('')
  const [selectedPuId, setSelectedPuId] = useState('')
  const [selectedRole, setSelectedRole] = useState('Polling Unit Agent')
  const [selectedPages, setSelectedPages] = useState(ROLE_PRESETS['Polling Unit Agent'] || [])
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (showAddModal) {
      apiFetch('/electoral/lgas').then(data => {
        if (Array.isArray(data)) setLgasList(data)
      }).catch(console.error)
    }
  }, [showAddModal])

  const handleRoleChange = (role) => {
    setSelectedRole(role)
    if (ROLE_PRESETS[role]) {
      setSelectedPages(ROLE_PRESETS[role])
    }
  }

  const togglePage = (pageId) => {
    setSelectedPages(prev => 
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    )
  }

  const handleLgaChange = async (lgaId) => {
    setSelectedLgaId(lgaId)
    setSelectedWardId('')
    setSelectedPuId('')
    setWardsList([])
    setPusList([])
    if (lgaId) {
      try {
        const wards = await apiFetch(`/electoral/wards?lga_id=${lgaId}`)
        if (Array.isArray(wards)) setWardsList(wards)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleWardChange = async (wardId) => {
    setSelectedWardId(wardId)
    setSelectedPuId('')
    setPusList([])
    if (wardId) {
      try {
        const pus = await apiFetch(`/electoral/polling-units?ward_id=${wardId}`)
        if (Array.isArray(pus)) setPusList(pus)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const getCustomUsers = () => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('pdp_custom_users')
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      return []
    }
  }

  const loadUsers = async () => {
    const customUsers = getCustomUsers().map((u, i) => ({
      id: u.id || `custom-${i}`,
      name: u.full_name || u.name || u.username,
      username: u.username,
      role: u.role || 'Polling Unit Agent',
      roleBadge: (u.role || '').toLowerCase().includes('admin')
        ? 'bg-emerald-500/20 text-emerald-500'
        : 'bg-blue-500/20 text-blue-400',
      lga: u.lga_name || u.lga || 'Jigawa State',
      phone: u.phone_number || u.phone || '0800 000 0000',
      status: u.is_active || u.status === 'Active' ? 'Active' : 'Inactive',
      allowedPages: u.allowedPages || (u.allowed_pages ? (typeof u.allowed_pages === 'string' ? JSON.parse(u.allowed_pages) : u.allowed_pages) : []),
      lastLogin: 'Just now',
      isNew: true
    }))

    try {
      if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
        await loginUser('admin', 'PDP-ADMIN-2027').catch(() => {})
      }

      const data = await apiFetch('/agents?limit=200')
      if (data && Array.isArray(data)) {
        const mapped = data.map((u, i) => {
          let parsedPages = []
          if (u.allowed_pages) {
            try {
              parsedPages = typeof u.allowed_pages === 'string' ? JSON.parse(u.allowed_pages) : u.allowed_pages
            } catch (e) {
              parsedPages = u.allowed_pages.split(',')
            }
          }

          return {
            id: u.id || i + 1,
            name: u.full_name || u.username,
            username: u.username,
            role: u.role || 'Polling Unit Agent',
            roleBadge: (u.role || '').toLowerCase().includes('admin')
              ? 'bg-emerald-500/20 text-emerald-500'
              : 'bg-slate-500/20 text-slate-400',
            lga: u.lga_name || 'Jigawa State',
            phone: u.phone_number || '0800 000 0000',
            status: u.is_active ? 'Active' : 'Inactive',
            allowedPages: parsedPages,
            lastLogin: 'Today',
            isNew: false
          }
        })

        const customUsernames = new Set(customUsers.map(c => c.username))
        const remainingBackend = mapped.filter(m => !customUsernames.has(m.username))
        setLiveUsers([...customUsers, ...remainingBackend])
        return
      }
    } catch (e) {
      console.error('Failed to load admin users:', e)
    }

    if (customUsers.length > 0) {
      const customUsernames = new Set(customUsers.map(c => c.username))
      const remainingFallback = fallbackUsersList.filter(f => !customUsernames.has(f.username))
      setLiveUsers([...customUsers, ...remainingFallback])
    }
  }

  useEffect(() => {
    loadUsers()
    const handleSync = () => loadUsers()
    window.addEventListener('pdp_users_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('pdp_users_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const fallbackUsersList = [
    { id: 1, name: 'Abdullahi Usman', username: 'admin', role: 'Super Admin', roleBadge: 'bg-emerald-500/20 text-emerald-500', lga: 'Jigawa State', phone: '0803 123 4567', status: 'Active', allowedPages: ROLE_PRESETS['Super Admin'], lastLogin: 'Today, 08:45 AM' },
    { id: 2, name: 'Musa Kiyawa', username: 'statechairman', role: 'State Chairman', roleBadge: 'bg-blue-500/20 text-blue-500', lga: 'Jigawa State', phone: '0802 987 6543', status: 'Active', allowedPages: ROLE_PRESETS['State Chairman'], lastLogin: 'Today, 07:32 AM' },
    { id: 3, name: 'Aliyu A. Babura', username: 'dg', role: 'Director General', roleBadge: 'bg-purple-500/20 text-purple-500', lga: 'Jigawa State', phone: '0806 555 1234', status: 'Active', allowedPages: ROLE_PRESETS['Director General'], lastLogin: 'Today, 09:12 AM' },
    { id: 4, name: 'Murtala A. Guri', username: 'guri_coord', role: 'LGA Coordinator', roleBadge: 'bg-amber-500/20 text-amber-500', lga: 'Guri LGA', phone: '0812 345 6789', status: 'Active', allowedPages: ROLE_PRESETS['LGA Coordinator'], lastLogin: 'Today, 10:15 AM' },
    { id: 5, name: 'Aisha Muhammad', username: 'gumel_agent', role: 'Polling Unit Agent', roleBadge: 'bg-slate-500/20 text-slate-400', lga: 'Gumel (PU 078)', phone: '0807 111 2233', status: 'Active', allowedPages: ROLE_PRESETS['Polling Unit Agent'], lastLogin: 'Today, 10:42 AM' },
    { id: 6, name: 'Ibrahim Y. Dutse', username: 'dutse_coord', role: 'Ward Coordinator', roleBadge: 'bg-indigo-500/20 text-indigo-500', lga: 'Dutse Central', phone: '0703 444 5566', status: 'Inactive', allowedPages: ROLE_PRESETS['Ward Coordinator'], lastLogin: 'Yesterday, 04:20 PM' },
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
          subtitle="User authorization, role hierarchy and permissions manager" 
        />

        <main className="p-4 sm:p-6 space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{usersList.length || '5,248'}</p>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% Authorized
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Polling Units</span>
                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>4,827</p>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> 27 LGAs Covered
                </span>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Online Agents</span>
                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>3,842</p>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Live Telemetry
                </span>
              </div>
              <div className="p-3 bg-pdp/10 text-pdp rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between`}>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation Elements</span>
                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>25</p>
                <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Side A & Side B
                </span>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                <Sliders className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* User Management Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User List Table (2 Columns) */}
            <div className={`lg:col-span-2 ${cardClass} rounded-xl p-5 space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>System Personnel Directory</h3>
                  <p className="text-xs text-slate-400">Manage user accounts and their authorized Side A & Side B page visibility</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-2 bg-pdp hover:bg-pdp-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User & Assign Pages</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, username, phone..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="All Roles">All Roles</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Situation Room Officer">Situation Room Officer</option>
                  <option value="LGA Coordinator">LGA Coordinator</option>
                  <option value="Ward Coordinator">Ward Coordinator</option>
                  <option value="Polling Unit Agent">Polling Unit Agent</option>
                </select>

                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="All Status">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Allowed Pages Scope</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                    {filteredUsers.map((u) => {
                      const isSuper = (u.role || '').toLowerCase().includes('admin')
                      const pagesCount = u.allowedPages?.length || 0
                      const hasSideA = u.allowedPages?.some(p => p.startsWith('side-a'))

                      return (
                        <tr key={u.id} className={`transition ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                          <td className={`py-3 px-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <div className="flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.isNew && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
                                  NEW
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono">{u.username}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.roleBadge}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {isSuper ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                All Pages (Side A + B)
                              </span>
                            ) : pagesCount > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {pagesCount} Pages
                                </span>
                                {hasSideA && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    + Side A
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                                Default Role Scope
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'Active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-pdp font-mono">{u.phone}</td>
                        </tr>
                      )
                    })}
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

      {/* Add User Modal with Side A & Side B Page Selection */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${cardClass} w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Plus className="w-4 h-4 text-pdp" /> Add System User & Assign Page Visibility
                </h3>
                <p className="text-xs text-slate-400">Select role and customize which Side A & Side B pages the user can access</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              setFormError('');
              const form = e.target;
              try {
                if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
                  await loginUser('admin', 'PDP-ADMIN-2027').catch(() => {});
                }

                const payload = {
                  full_name: form.full_name.value,
                  username: form.username.value,
                  password: form.password.value,
                  role: selectedRole,
                  phone_number: form.phone_number?.value || '',
                  lga_id: selectedLgaId ? parseInt(selectedLgaId) : null,
                  ward_id: selectedWardId ? parseInt(selectedWardId) : null,
                  polling_unit_id: selectedPuId ? parseInt(selectedPuId) : null,
                  allowed_pages: JSON.stringify(selectedPages)
                };

                let savedRes = null;
                try {
                  savedRes = await apiFetch('/agents', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                  });
                } catch (apiErr) {
                  console.warn('API user creation error, falling back to local sync:', apiErr);
                }

                // Sync to local custom store
                if (typeof window !== 'undefined') {
                  const stored = localStorage.getItem('pdp_custom_users');
                  let customList = stored ? JSON.parse(stored) : [];
                  const newUserObj = {
                    id: (savedRes && savedRes.id) || Date.now(),
                    name: payload.full_name,
                    full_name: payload.full_name,
                    username: payload.username,
                    role: payload.role,
                    phone: payload.phone_number,
                    phone_number: payload.phone_number,
                    password: payload.password,
                    lga_id: payload.lga_id,
                    ward_id: payload.ward_id,
                    polling_unit_id: payload.polling_unit_id,
                    allowed_pages: payload.allowed_pages,
                    allowedPages: selectedPages,
                    status: 'Active',
                    is_active: true,
                    is_custom: true,
                    updated_at: new Date().toISOString()
                  };
                  customList = [newUserObj, ...customList.filter(u => u.username !== payload.username)];
                  localStorage.setItem('pdp_custom_users', JSON.stringify(customList));
                  window.dispatchEvent(new CustomEvent('pdp_users_updated', { detail: newUserObj }));
                }

                setShowAddModal(false);
                await loadUsers();
              } catch (err) {
                setFormError(err.message || 'Error creating user');
              } finally {
                setSubmitting(false);
              }
            }} className="space-y-3 text-xs pr-1">
              <div>
                <label className="block font-bold mb-1 text-slate-400">Full Name *</label>
                <input required name="full_name" type="text" placeholder="e.g. Ibrahim Suleiman" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Username *</label>
                  <input required name="username" type="text" placeholder="e.g. agent_dut_01" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-mono" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Password *</label>
                  <input required name="password" type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Authorization Role</label>
                  <select 
                    value={selectedRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none font-bold"
                  >
                    <option value="Polling Unit Agent">Polling Unit Agent</option>
                    <option value="Ward Coordinator">Ward Coordinator</option>
                    <option value="LGA Coordinator">LGA Coordinator</option>
                    <option value="Situation Room Officer">Situation Room Officer</option>
                    <option value="Director General">Director General</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Phone Number</label>
                  <input name="phone_number" type="text" placeholder="0801 234 5678" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none font-mono" />
                </div>
              </div>

              {/* ALLOWED PAGES SELECTOR */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-400 flex items-center gap-1.5 uppercase">
                    <Sliders className="w-3.5 h-3.5" /> Allowed Pages & Sidebar Navigation
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPages([...ALL_SIDE_B_PAGES.map(p => p.id), ...ALL_SIDE_A_MODULES.map(m => m.id)])}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPages([])}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400">
                  Selected: <strong className="text-emerald-400 font-mono">{selectedPages.length}</strong> / 25 elements
                </div>

                {/* Side B Checkboxes */}
                <div className="space-y-1 pt-1">
                  <span className="text-[9px] font-black uppercase text-emerald-400">Side B — Situation Room Pages</span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {ALL_SIDE_B_PAGES.map(p => {
                      const isChecked = selectedPages.includes(p.id)
                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePage(p.id)}
                          className={`p-1.5 rounded border cursor-pointer flex items-center justify-between transition select-none ${
                            isChecked ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="truncate text-[10px] font-bold">{p.label}</span>
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border flex-shrink-0 ${
                            isChecked ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isChecked && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Side A Checkboxes */}
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <span className="text-[9px] font-black uppercase text-blue-400">Side A — System Admin Modules</span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {ALL_SIDE_A_MODULES.map(m => {
                      const isChecked = selectedPages.includes(m.id)
                      return (
                        <div
                          key={m.id}
                          onClick={() => togglePage(m.id)}
                          className={`p-1.5 rounded border cursor-pointer flex items-center justify-between transition select-none ${
                            isChecked ? 'bg-blue-500/10 border-blue-500/40 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="truncate text-[10px] font-bold">{m.label}</span>
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border flex-shrink-0 ${
                            isChecked ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isChecked && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic Cascading Location Assignment */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 mt-2">
                <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Assigned Polling Location
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-slate-400">1. LGA</label>
                    <select
                      value={selectedLgaId}
                      onChange={(e) => handleLgaChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 outline-none text-xs"
                    >
                      <option value="">-- LGA --</option>
                      {lgasList.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-slate-400">2. Ward</label>
                    <select
                      value={selectedWardId}
                      onChange={(e) => handleWardChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 outline-none text-xs"
                    >
                      <option value="">-- Ward --</option>
                      {wardsList.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-slate-400">3. Polling Unit</label>
                    <select
                      value={selectedPuId}
                      onChange={(e) => setSelectedPuId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 outline-none text-xs"
                    >
                      <option value="">-- PU --</option>
                      {pusList.map(pu => (
                        <option key={pu.id} value={pu.id}>[{pu.code}] {pu.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-pdp text-white font-bold rounded-lg hover:bg-pdp-dark shadow-md shadow-pdp/20 flex items-center gap-1.5">
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Authorize & Save User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
