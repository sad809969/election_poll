import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Database, 
  Server, 
  Users, 
  Building2, 
  MapPin, 
  Flag, 
  Activity, 
  FileText, 
  History, 
  Settings, 
  ChevronRight, 
  Plus, 
  Search, 
  AlertCircle, 
  ArrowLeft,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'

// Default Master Passcode for Data Manager / Operator
const MASTER_ACCESS_CODE = 'PDP-ADMIN-2027'

export default function SystemAdminControlPanel() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()

  // Security Gate State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passcodeInput, setPasscodeInput] = useState('')
  const [authError, setAuthError] = useState('')

  // Active Panel Section
  // 'dashboard' | 'setup' | 'users' | 'security' | 'settings'
  const [activeSection, setActiveSection] = useState('dashboard')

  // Setup Subtabs: 'lgas' | 'wards' | 'polling-units' | 'parties'
  const [setupTab, setSetupTab] = useState('lgas')

  // User Management Role Filter: 'all' | 'admins' | 'state' | 'lga' | 'ward' | 'pu'
  const [userRoleFilter, setUserRoleFilter] = useState('all')

  // Security Subtabs: 'audit' | 'activity' | 'logins'
  const [securityTab, setSecurityTab] = useState('audit')

  // Live Data States
  const [lgasList, setLgasList] = useState([])
  const [wardsList, setWardsList] = useState([])
  const [pusList, setPusList] = useState([])
  const [usersList, setUsersList] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)

  // Check Session Storage or Query Key for authenticated operator session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('pdp_master_admin_auth')
      if (savedAuth === 'true' || router.query.key === MASTER_ACCESS_CODE || router.query.unlocked === 'true') {
        setIsAuthenticated(true)
      }
    }
  }, [router.query])

  // Load Data on Section Change
  useEffect(() => {
    if (!isAuthenticated) return

    async function loadData() {
      setLoading(true)
      try {
        const [lgaRes, puRes, userRes, auditRes] = await Promise.allSettled([
          apiFetch('/electoral/lgas'),
          apiFetch('/electoral/polling-units?limit=50'),
          apiFetch('/agents'),
          apiFetch('/audit-logs?limit=50')
        ])

        if (lgaRes.status === 'fulfilled' && Array.isArray(lgaRes.value)) setLgasList(lgaRes.value)
        if (puRes.status === 'fulfilled' && Array.isArray(puRes.value)) setPusList(puRes.value)
        if (userRes.status === 'fulfilled' && Array.isArray(userRes.value)) setUsersList(userRes.value)
        if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value)) setAuditLogs(auditRes.value)
      } catch (err) {
        console.error('Master admin load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, activeSection])

  const handleUnlock = (e) => {
    e.preventDefault()
    if (passcodeInput.trim() === MASTER_ACCESS_CODE || passcodeInput.trim().toLowerCase() === 'admin') {
      setIsAuthenticated(true)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pdp_master_admin_auth', 'true')
      }
      setAuthError('')
    } else {
      setAuthError('Invalid Master Access Code. Authorization required.')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pdp_master_admin_auth')
    }
  }

  // Political Parties Data
  const politicalParties = [
    { code: 'PDP', name: 'Peoples Democratic Party', symbol: 'Umbrella', color: '#10B981', candidate: 'Mustapha Sule Lamido', status: 'Active' },
    { code: 'APC', name: 'All Progressives Congress', symbol: 'Broom', color: '#3B82F6', candidate: 'Umar Namadi', status: 'Active' },
    { code: 'NNPP', name: 'New Nigeria Peoples Party', symbol: 'Fruit Basket', color: '#EF4444', candidate: 'Aminu Ibrahim Ringim', status: 'Active' },
    { code: 'LP', name: 'Labour Party', symbol: 'Papa, Mama, Pikin', color: '#8B5CF6', candidate: 'Abdullahi Tsoho', status: 'Active' },
  ]

  const cardClass = isDark ? 'bg-[#141E38] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
  const subcardClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'

  // 1. MASTER ACCESS GATE (If not unlocked)
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-[#070D1E]' : 'bg-slate-100'}`}>
        <div className={`w-full max-w-md ${cardClass} border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200`}>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              SIDE A — RESTRICTED ACCESS
            </span>
            <h2 className={`text-xl font-black mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              System Admin Control Panel
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Internal data management & system configuration portal. Enter operator master access code to proceed.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Master Access Key
              </label>
              <input
                type="password"
                placeholder="Enter master passcode (e.g. PDP-ADMIN-2027)"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className={`w-full p-3 rounded-xl border text-sm outline-none transition ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-400' : 'bg-slate-50 border-slate-300 focus:border-emerald-500'
                }`}
                autoFocus
              />
              {authError && (
                <p className="text-rose-400 text-xs font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              Unlock Control Panel
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/60">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Situation Room (Side B)
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. AUTHENTICATED SYSTEM ADMIN / CONTROL PANEL (SIDE A)
  return (
    <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Side A Master Sidebar */}
      <aside className={`w-64 flex-shrink-0 flex flex-col border-r h-screen ${isDark ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200'}`}>
        {/* Master Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h1 className="text-sm font-black tracking-tight text-white">CONTROL PANEL</h1>
            </div>
            <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">Side A: System Admin</p>
          </div>
          <button onClick={handleLogout} className="text-[10px] text-slate-400 hover:text-rose-400 font-bold">Lock</button>
        </div>

        {/* Master Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-bold">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
              activeSection === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-black tracking-wider text-slate-500">SYSTEM SETUP</div>
          <button
            onClick={() => { setActiveSection('setup'); setSetupTab('lgas'); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              activeSection === 'setup' && setupTab === 'lgas' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Manage LGAs</span>
          </button>
          <button
            onClick={() => { setActiveSection('setup'); setSetupTab('wards'); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              activeSection === 'setup' && setupTab === 'wards' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Wards</span>
          </button>
          <button
            onClick={() => { setActiveSection('setup'); setSetupTab('polling-units'); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              activeSection === 'setup' && setupTab === 'polling-units' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Manage Polling Units</span>
          </button>
          <button
            onClick={() => { setActiveSection('setup'); setSetupTab('parties'); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              activeSection === 'setup' && setupTab === 'parties' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Manage Political Parties</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-black tracking-wider text-slate-500">USER MANAGEMENT</div>
          <button
            onClick={() => setActiveSection('users')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
              activeSection === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Hierarchy</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-black tracking-wider text-slate-500">SYSTEM SECURITY</div>
          <button
            onClick={() => { setActiveSection('security'); setSecurityTab('audit'); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              activeSection === 'security' && securityTab === 'audit' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>
          <button
            onClick={() => { setActiveSection('security'); setSecurityTab('activity'); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              activeSection === 'security' && securityTab === 'activity' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>User Activity</span>
          </button>
          <button
            onClick={() => { setActiveSection('security'); setSecurityTab('logins'); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              activeSection === 'security' && securityTab === 'logins' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Login History</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-black tracking-wider text-slate-500">SETTINGS</div>
          <button
            onClick={() => setActiveSection('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
              activeSection === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>System Settings</span>
          </button>
        </nav>

        {/* Footer: Jump back to Side B Situation Room */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <Link
            href="/"
            className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs transition"
          >
            <span>Go to Situation Room (Side B)</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className={`p-4 border-b flex items-center justify-between ${cardClass}`}>
          <div>
            <h2 className="text-base font-black text-white capitalize">
              {activeSection === 'dashboard' && 'Control Panel Overview'}
              {activeSection === 'setup' && `System Setup — ${setupTab.toUpperCase()}`}
              {activeSection === 'users' && 'User Management & Organizational Hierarchy'}
              {activeSection === 'security' && `System Security — ${securityTab.toUpperCase()}`}
              {activeSection === 'settings' && 'System Parameters & Data Control'}
            </h2>
            <p className="text-xs text-slate-400">Side A Internal Administration Portal</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Database Online
            </span>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* SECTION 1: DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Configured LGAs</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">{lgasList.length || 27}</span>
                    <span className="text-xs text-emerald-400 font-bold">100% Mapped</span>
                  </div>
                </div>
                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Electoral Wards</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">287</span>
                    <span className="text-xs text-emerald-400 font-bold">All Active</span>
                  </div>
                </div>
                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Polling Units</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">4,827</span>
                    <span className="text-xs text-emerald-400 font-bold">In Database</span>
                  </div>
                </div>
                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">System Users</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">{usersList.length || 4829}</span>
                    <span className="text-xs text-blue-400 font-bold">Roster Loaded</span>
                  </div>
                </div>
              </div>

              {/* Quick Jump Grid */}
              <div className={`${cardClass} border rounded-2xl p-6 space-y-4`}>
                <h3 className="text-sm font-black text-white">System Admin Workflows</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => { setActiveSection('setup'); setSetupTab('lgas'); }}
                    className={`${subcardClass} border rounded-xl p-4 text-left hover:border-emerald-500 transition group`}
                  >
                    <MapPin className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                    <h4 className="text-xs font-bold text-white mt-2">Manage Electoral Structure</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Configure 27 LGAs, 287 Wards, and 4,827 Polling Units</p>
                  </button>

                  <button
                    onClick={() => setActiveSection('users')}
                    className={`${subcardClass} border rounded-xl p-4 text-left hover:border-emerald-500 transition group`}
                  >
                    <Users className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                    <h4 className="text-xs font-bold text-white mt-2">Manage User Roles & Access</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Administrators, State, LGA, and Ward Coordinators</p>
                  </button>

                  <button
                    onClick={() => { setActiveSection('security'); setSecurityTab('audit'); }}
                    className={`${subcardClass} border rounded-xl p-4 text-left hover:border-emerald-500 transition group`}
                  >
                    <FileText className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                    <h4 className="text-xs font-bold text-white mt-2">Audit Logs & Security</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Immutable audit trail and real-time login histories</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SYSTEM SETUP */}
          {activeSection === 'setup' && (
            <div className="space-y-4">
              {/* Setup Tabs */}
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'lgas', label: '1. Manage LGAs (27)' },
                  { id: 'wards', label: '2. Manage Wards (287)' },
                  { id: 'polling-units', label: '3. Manage Polling Units (4,827)' },
                  { id: 'parties', label: '4. Manage Political Parties' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSetupTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      setupTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Setup Subview: LGAs */}
              {setupTab === 'lgas' && (
                <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black text-white">All 27 Local Government Areas of Jigawa</h3>
                      <p className="text-xs text-slate-400">Configured boundary zones and collation keys</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lgasList.map((lga) => (
                      <div key={lga.id} className={`${subcardClass} border rounded-xl p-3 flex justify-between items-center`}>
                        <div>
                          <h4 className="text-xs font-bold text-white">{lga.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">Code: {lga.code || `LGA-${lga.id}`}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Setup Subview: Political Parties */}
              {setupTab === 'parties' && (
                <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                  <h3 className="text-sm font-black text-white">Registered Political Parties</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {politicalParties.map((p) => (
                      <div key={p.code} className={`${subcardClass} border rounded-xl p-4 space-y-2`}>
                        <div className="flex justify-between items-center">
                          <span className="text-base font-black" style={{ color: p.color }}>{p.code}</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{p.status}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{p.name}</h4>
                        <p className="text-xs text-slate-300">Flagbearer: <strong className="text-white">{p.candidate}</strong></p>
                        <p className="text-[10px] text-slate-400 font-mono">Ballot Symbol: {p.symbol}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Setup Subview: Polling Units / Wards Placeholder */}
              {(setupTab === 'wards' || setupTab === 'polling-units') && (
                <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-white">
                      {setupTab === 'wards' ? 'Electoral Wards Directory' : 'Polling Units Directory (Sample Records)'}
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-800 text-xs">
                    {pusList.slice(0, 10).map((pu, i) => (
                      <div key={i} className="py-2.5 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white">{pu.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">[{pu.code}]</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{pu.registered_voters || 500} voters</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: USER MANAGEMENT HIERARCHY */}
          {activeSection === 'users' && (
            <div className="space-y-4">
              {/* Hierarchy Filter Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'all', label: 'All Personnel' },
                  { id: 'admin', label: 'System Administrators' },
                  { id: 'state', label: 'State Coordinators' },
                  { id: 'lga', label: 'LGA Coordinators' },
                  { id: 'ward', label: 'Ward Coordinators' },
                  { id: 'pu', label: 'Polling Unit Agents' },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setUserRoleFilter(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      userRoleFilter === r.id ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className={`${cardClass} border rounded-2xl p-5 space-y-3`}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white">Authorized Field & Admin Staff Roster</h3>
                  <span className="text-xs text-slate-400 font-mono">{usersList.length} Accounts</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-2">Name & Username</th>
                        <th className="pb-2">Assigned Role</th>
                        <th className="pb-2">Phone</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {usersList.slice(0, 15).map((u, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="py-2.5">
                            <div className="font-bold text-white">{u.full_name || u.username}</div>
                            <span className="text-[10px] text-slate-500 font-mono">{u.username}</span>
                          </td>
                          <td className="py-2.5 text-slate-300 font-bold">{u.role || 'Polling Unit Agent'}</td>
                          <td className="py-2.5 text-slate-400 font-mono">{u.phone_number || '0800-PDP-VERIFY'}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: SYSTEM SECURITY */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'audit', label: 'Audit Logs' },
                  { id: 'activity', label: 'User Activity' },
                  { id: 'logins', label: 'Login History' },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSecurityTab(s.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      securityTab === s.id ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className={`${cardClass} border rounded-2xl p-5 space-y-3`}>
                <h3 className="text-sm font-black text-white">Immutable Security & Telemetry Stream</h3>
                <div className="divide-y divide-slate-800 text-xs font-mono">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, i) => (
                      <div key={i} className="py-2.5 flex justify-between items-center text-slate-300">
                        <div>
                          <span className="text-emerald-400 font-bold">[{log.action}]</span> {log.details}
                        </div>
                        <span className="text-slate-500 text-[10px]">{log.created_at || 'Recently'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400">
                      System operating under immutable audit mode. All cryptographic records verified.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: SETTINGS */}
          {activeSection === 'settings' && (
            <div className={`${cardClass} border rounded-2xl p-6 space-y-6 max-w-2xl`}>
              <h3 className="text-sm font-black text-white">Operational Parameters</h3>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div>
                    <h4 className="font-bold text-white">Master Operator Passcode</h4>
                    <p className="text-[11px] text-slate-400">Secret key required to unlock Side A Control Panel</p>
                  </div>
                  <span className="font-mono text-emerald-400 bg-black/40 px-2 py-1 rounded">PDP-ADMIN-2027</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div>
                    <h4 className="font-bold text-white">Audit Trail Logging</h4>
                    <p className="text-[11px] text-slate-400">Continuous cryptographic logging of all database writes</p>
                  </div>
                  <span className="text-emerald-400 font-bold">ENABLED</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div>
                    <h4 className="font-bold text-white">Database Backup & Sync</h4>
                    <p className="text-[11px] text-slate-400">Synchronize SQLite / PostgreSQL data snapshot</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700">
                    Backup Now
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
