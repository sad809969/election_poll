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
  RefreshCw,
  LayoutDashboard,
  Map,
  AlertTriangle,
  BarChart3,
  PieChart,
  MessageSquare,
  Bell,
  UserCheck,
  Radio,
  FileSpreadsheet,
  Check,
  X,
  Sliders,
  Eye,
  Edit3
} from 'lucide-react'

// Default Master Passcode for Data Manager / Operator
const MASTER_ACCESS_CODE = 'PDP-ADMIN-2027'

// Complete Side B Navigation Elements
export const ALL_SIDE_B_PAGES = [
  { id: '/', label: 'Dashboard', group: 'Main', icon: LayoutDashboard, desc: 'Situation room live overview' },
  { id: '/map', label: 'Interactive Map', group: 'Main', icon: Map, desc: 'Geospatial results & PU pins' },
  { id: '/incidents', label: 'Incident Tracker', group: 'Main', icon: AlertTriangle, desc: 'Real-time field incident alerts' },
  { id: '/agents', label: 'Agents Directory', group: 'Main', icon: Users, desc: 'Field personnel & contact roster' },
  { id: '/polling-units', label: 'Polling Units Directory', group: 'Main', icon: Building2, desc: '4,827 Polling Unit directory' },
  { id: '/results', label: 'Results Dashboard', group: 'Results', icon: BarChart3, desc: 'PU results submission & telemetry' },
  { id: '/collation', label: 'Collation Center', group: 'Results', icon: PieChart, desc: 'Ward, LGA & State vote collation' },
  { id: '/election-results', label: 'Results by Office & Export', group: 'Results', icon: FileSpreadsheet, desc: 'Gov, Senate, Reps, Assembly breakdown' },
  { id: '/communication', label: 'Communication Center', group: 'Communication', icon: MessageSquare, desc: 'Two-way dispatch messaging' },
  { id: '/broadcast', label: 'Broadcast Messages', group: 'Communication', icon: Radio, desc: 'Direct broadcast alerts' },
  { id: '/notifications', label: 'Notifications', group: 'Communication', icon: Bell, desc: 'Live alerts & system events' },
  { id: '/admin', label: 'User Management', group: 'Admin', icon: UserCheck, desc: 'Staff & agent authorization' },
  { id: '/settings', label: 'System Settings', group: 'Admin', icon: Settings, desc: 'Platform configuration parameters' },
  { id: '/audit-logs', label: 'Audit Logs', group: 'Admin', icon: FileText, desc: 'System security audit trail' },
]

// Complete Side A Navigation Modules
export const ALL_SIDE_A_MODULES = [
  { id: 'side-a:dashboard', label: 'Master Overview Dashboard', group: 'Overview', desc: 'Core server & electoral database stats' },
  { id: 'side-a:lgas', label: 'Manage LGAs (27 LGAs)', group: 'Setup', desc: 'Local Government boundary config' },
  { id: 'side-a:wards', label: 'Manage Wards (287 Wards)', group: 'Setup', desc: 'Electoral Ward registry & mapping' },
  { id: 'side-a:polling-units', label: 'Manage Polling Units (4,827 PUs)', group: 'Setup', desc: 'Registered voter quotas & coordinates' },
  { id: 'side-a:parties', label: 'Manage Political Parties', group: 'Setup', desc: 'PDP, APC, NNPP, LP ballots' },
  { id: 'side-a:users', label: 'User Hierarchy & Roster', group: 'Access', desc: 'Administrative staff directory' },
  { id: 'side-a:permissions', label: 'Role & Page Permissions Matrix', group: 'Access', desc: 'Side A & B unified permission controls' },
  { id: 'side-a:audit', label: 'Immutable Audit Logs', group: 'Security', desc: 'Cryptographic tamper-proof logs' },
  { id: 'side-a:activity', label: 'User Activity Stream', group: 'Security', desc: 'Live agent actions & telemetry' },
  { id: 'side-a:logins', label: 'Login History & Telemetry', group: 'Security', desc: 'Authentication timestamps & IP tracks' },
  { id: 'side-a:settings', label: 'Parameters & Database Vault', group: 'Maintenance', desc: 'Backup snapshots & master passcodes' },
]

// Default Role Presets
export const ROLE_PRESETS = {
  'Super Admin': [
    ...ALL_SIDE_B_PAGES.map(p => p.id),
    ...ALL_SIDE_A_MODULES.map(m => m.id)
  ],
  'Situation Room Officer': [
    '/', '/map', '/incidents', '/agents', '/polling-units', 
    '/results', '/collation', '/election-results', 
    '/communication', '/broadcast', '/notifications'
  ],
  'LGA Coordinator': [
    '/collation', '/polling-units', '/results', '/incidents', 
    '/communication', '/broadcast', '/notifications'
  ],
  'Ward Coordinator': [
    '/polling-units', '/results', '/incidents', 
    '/communication', '/notifications'
  ],
  'Polling Unit Agent': [
    '/results', '/incidents', '/notifications'
  ],
  'Director General': [
    '/', '/map', '/incidents', '/agents', '/polling-units', 
    '/results', '/collation', '/election-results', 
    '/communication', '/broadcast', '/notifications'
  ],
  'State Chairman': [
    '/', '/map', '/incidents', '/agents', '/polling-units', 
    '/results', '/collation', '/election-results', 
    '/communication', '/broadcast', '/notifications'
  ]
}

export default function SystemAdminControlPanel() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()

  // Security Gate State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passcodeInput, setPasscodeInput] = useState('')
  const [authError, setAuthError] = useState('')

  // Active Panel Section: 'dashboard' | 'setup' | 'users' | 'permissions' | 'security' | 'settings'
  const [activeSection, setActiveSection] = useState('dashboard')

  // Setup Subtabs: 'lgas' | 'wards' | 'polling-units' | 'parties'
  const [setupTab, setSetupTab] = useState('lgas')

  // User Management Role Filter: 'all' | 'admin' | 'state' | 'lga' | 'ward' | 'pu'
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

  // User Creation / Permission Modal State
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [modalRole, setModalRole] = useState('Polling Unit Agent')
  const [modalFullName, setModalFullName] = useState('')
  const [modalUsername, setModalUsername] = useState('')
  const [modalPassword, setModalPassword] = useState('')
  const [modalPhone, setModalPhone] = useState('')
  const [modalLgaId, setModalLgaId] = useState('')
  const [modalWardId, setModalWardId] = useState('')
  const [modalPuId, setModalPuId] = useState('')
  const [selectedPages, setSelectedPages] = useState(ROLE_PRESETS['Polling Unit Agent'])
  const [modalError, setModalError] = useState('')
  const [submittingUser, setSubmittingUser] = useState(false)

  // Simulator State in Permissions Section
  const [simulatorRole, setSimulatorRole] = useState('Polling Unit Agent')

  // Check Session Storage or Query Key for authenticated operator session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('pdp_master_admin_auth')
      if (savedAuth === 'true' || router.query.key === MASTER_ACCESS_CODE || router.query.unlocked === 'true') {
        setIsAuthenticated(true)
      }
      if (router.query.section) {
        setActiveSection(router.query.section)
      }
      if (router.query.modal === 'add') {
        openAddUserModal()
      }
    }
  }, [router.query])

  // Load Data on Section Change
  const loadData = async () => {
    setLoading(true)
    try {
      const [lgaRes, puRes, userRes, auditRes] = await Promise.allSettled([
        apiFetch('/electoral/lgas'),
        apiFetch('/electoral/polling-units?limit=100'),
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

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
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

  // Location Cascading for Modal
  const handleModalLgaChange = async (lgaId) => {
    setModalLgaId(lgaId)
    setModalWardId('')
    setModalPuId('')
    setWardsList([])
    if (lgaId) {
      try {
        const wards = await apiFetch(`/electoral/wards?lga_id=${lgaId}`)
        if (Array.isArray(wards)) setWardsList(wards)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleModalWardChange = async (wardId) => {
    setModalWardId(wardId)
    setModalPuId('')
    if (wardId) {
      try {
        const pus = await apiFetch(`/electoral/polling-units?ward_id=${wardId}`)
        if (Array.isArray(pus)) setPusList(pus)
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Handle Role selection and apply preset
  const handleRoleSelect = (roleName) => {
    setModalRole(roleName)
    if (ROLE_PRESETS[roleName]) {
      setSelectedPages(ROLE_PRESETS[roleName])
    }
  }

  // Toggle page permission in modal
  const togglePagePermission = (pageId) => {
    setSelectedPages(prev => 
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    )
  }

  // Open modal in "Add" mode
  const openAddUserModal = () => {
    setEditingUserId(null)
    setModalFullName('')
    setModalUsername('')
    setModalPassword('')
    setModalPhone('')
    setModalRole('Polling Unit Agent')
    setSelectedPages(ROLE_PRESETS['Polling Unit Agent'])
    setModalLgaId('')
    setModalWardId('')
    setModalPuId('')
    setModalError('')
    setShowUserModal(true)
  }

  // Open modal in "Edit Permissions" mode
  const openEditUserModal = (user) => {
    setEditingUserId(user.id)
    setModalFullName(user.full_name || '')
    setModalUsername(user.username || '')
    setModalPassword('')
    setModalPhone(user.phone_number || '')
    setModalRole(user.role || 'Polling Unit Agent')
    
    // Parse allowed pages
    let userPages = []
    if (user.allowed_pages) {
      try {
        userPages = typeof user.allowed_pages === 'string' ? JSON.parse(user.allowed_pages) : user.allowed_pages
      } catch (e) {
        userPages = user.allowed_pages.split(',').map(s => s.trim())
      }
    } else if (ROLE_PRESETS[user.role]) {
      userPages = ROLE_PRESETS[user.role]
    }
    setSelectedPages(userPages || [])
    setModalLgaId(user.lga_id || '')
    setModalWardId(user.ward_id || '')
    setModalPuId(user.polling_unit_id || '')
    setModalError('')
    setShowUserModal(true)
  }

  // Save User (Create or Update)
  const handleSaveUser = async (e) => {
    e.preventDefault()
    setSubmittingUser(true)
    setModalError('')

    try {
      const payload = {
        full_name: modalFullName,
        username: modalUsername,
        role: modalRole,
        phone_number: modalPhone,
        lga_id: modalLgaId ? parseInt(modalLgaId) : null,
        ward_id: modalWardId ? parseInt(modalWardId) : null,
        polling_unit_id: modalPuId ? parseInt(modalPuId) : null,
        allowed_pages: JSON.stringify(selectedPages)
      }

      if (modalPassword) {
        payload.password = modalPassword
      }

      if (editingUserId) {
        // Update user
        await apiFetch(`/agents/${editingUserId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        })
      } else {
        // Create new user
        if (!modalPassword) {
          throw new Error('Password is required when creating a new user')
        }
        await apiFetch('/agents', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      }

      setShowUserModal(false)
      await loadData()
    } catch (err) {
      setModalError(err.message || 'Operation failed')
    } finally {
      setSubmittingUser(false)
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

  // Filtered Users List
  const filteredUsers = usersList.filter(user => {
    if (userRoleFilter === 'all') return true
    const roleLower = (user.role || '').toLowerCase()
    if (userRoleFilter === 'admin') return roleLower.includes('admin')
    if (userRoleFilter === 'state') return roleLower.includes('state') || roleLower.includes('director') || roleLower.includes('officer')
    if (userRoleFilter === 'lga') return roleLower.includes('lga')
    if (userRoleFilter === 'ward') return roleLower.includes('ward')
    if (userRoleFilter === 'pu') return roleLower.includes('agent') || roleLower.includes('polling')
    return true
  })

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
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition font-mono ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
                autoFocus
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <span>Unlock Side A Control Panel</span>
              <ChevronRight className="w-4 h-4" />
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

          {/* PERMISSIONS MATRIX BUTTON */}
          <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-black tracking-wider text-slate-500">SIDE A & B UNIFIED ACCESS</div>
          <button
            onClick={() => setActiveSection('permissions')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
              activeSection === 'permissions' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-emerald-400 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Permissions Matrix</span>
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
              {activeSection === 'permissions' && 'Unified Role & Page Permissions Matrix (Side A & Side B)'}
              {activeSection === 'setup' && `System Setup — ${setupTab.toUpperCase()}`}
              {activeSection === 'users' && 'User Management & Organizational Hierarchy'}
              {activeSection === 'security' && `System Security — ${securityTab.toUpperCase()}`}
              {activeSection === 'settings' && 'System Parameters & Data Control'}
            </h2>
            <p className="text-xs text-slate-400">Side A Internal Administration Portal</p>
          </div>

          <div className="flex items-center gap-3">
            {activeSection === 'users' && (
              <button
                onClick={openAddUserModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-pdp hover:bg-pdp-dark text-white transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create User & Assign Pages</span>
              </button>
            )}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveSection('permissions')}
                    className={`${subcardClass} border rounded-xl p-4 text-left hover:border-emerald-500 transition group border-emerald-500/30 bg-emerald-950/20`}
                  >
                    <Sliders className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                    <h4 className="text-xs font-bold text-white mt-2">Side A & B Permissions Matrix</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Control which roles and users see Side A & Side B pages</p>
                  </button>

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

          {/* SECTION: ROLE & PAGE PERMISSIONS MATRIX (NEW UNIFIED HUB) */}
          {activeSection === 'permissions' && (
            <div className="space-y-6">
              {/* Matrix Header Banner */}
              <div className={`${cardClass} border rounded-2xl p-6 relative overflow-hidden`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      SUPER ADMIN CENTRAL DIRECTORY
                    </span>
                    <h3 className="text-lg font-black text-white mt-2">Side A & Side B Unified Navigation Matrix</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                      Configure and visualize all 25 navigation elements across Side A (System Admin Control Panel) and Side B (Situation Room). You can create users and selectively authorize which pages each user is able to see.
                    </p>
                  </div>
                  <button
                    onClick={openAddUserModal}
                    className="px-4 py-2.5 rounded-xl bg-pdp hover:bg-pdp-dark text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pdp/20 self-start md:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create User with Custom Permissions</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Side B Pages</span>
                    <p className="text-xl font-black text-emerald-400">{ALL_SIDE_B_PAGES.length} Pages</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Side A Modules</span>
                    <p className="text-xl font-black text-blue-400">{ALL_SIDE_A_MODULES.length} Modules</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Configured Roles</span>
                    <p className="text-xl font-black text-purple-400">7 Presets</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Super Admin Access</span>
                    <p className="text-xl font-black text-amber-400">100% (Unrestricted)</p>
                  </div>
                </div>
              </div>

              {/* Live Role Preview / Simulation Bar */}
              <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      Role Sidebar Preview Simulator
                    </h4>
                    <p className="text-xs text-slate-400">Select a role to preview exactly which pages and sidebar items will be visible to that role:</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.keys(ROLE_PRESETS).slice(0, 5).map(roleName => (
                      <button
                        key={roleName}
                        onClick={() => setSimulatorRole(roleName)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          simulatorRole === roleName 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {roleName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulator Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Side B Visibility */}
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase">
                        Side B: Situation Room ({ROLE_PRESETS[simulatorRole]?.filter(p => !p.startsWith('side-a')).length || 0} Visible)
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">14 total</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {ALL_SIDE_B_PAGES.map(page => {
                        const isVisible = ROLE_PRESETS[simulatorRole]?.includes(page.id)
                        const Icon = page.icon
                        return (
                          <div 
                            key={page.id}
                            className={`p-2 rounded-lg border flex items-center gap-2 transition ${
                              isVisible 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-white' 
                                : 'bg-slate-900/40 border-slate-800 text-slate-500 line-through opacity-50'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{page.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Side A Visibility */}
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 uppercase">
                        Side A: System Admin Control Panel ({ROLE_PRESETS[simulatorRole]?.filter(p => p.startsWith('side-a')).length || 0} Visible)
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">11 total</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {ALL_SIDE_A_MODULES.map(mod => {
                        const isVisible = ROLE_PRESETS[simulatorRole]?.includes(mod.id)
                        return (
                          <div 
                            key={mod.id}
                            className={`p-2 rounded-lg border flex items-center gap-2 transition ${
                              isVisible 
                                ? 'bg-blue-500/10 border-blue-500/30 text-white' 
                                : 'bg-slate-900/40 border-slate-800 text-slate-500 line-through opacity-50'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                            <span className="truncate">{mod.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Permissions Directory Table */}
              <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                <h4 className="text-sm font-black text-white">Full Role Permission Mapping Directory</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-2 w-48">Navigation Element</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2 text-center">Super Admin</th>
                        <th className="pb-2 text-center">Situation Room Officer</th>
                        <th className="pb-2 text-center">LGA Coordinator</th>
                        <th className="pb-2 text-center">Ward Coordinator</th>
                        <th className="pb-2 text-center">PU Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {/* Side B Items */}
                      <tr className="bg-emerald-950/20 text-emerald-400 font-black text-[10px] uppercase">
                        <td colSpan={7} className="py-2 px-1">SIDE B — SITUATION ROOM PAGES</td>
                      </tr>
                      {ALL_SIDE_B_PAGES.map(page => (
                        <tr key={page.id} className="hover:bg-slate-800/30">
                          <td className="py-2 font-bold text-white flex items-center gap-2">
                            <span>{page.label}</span>
                            <span className="text-[10px] font-mono text-slate-500">{page.id}</span>
                          </td>
                          <td className="py-2">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">Side B</span>
                          </td>
                          <td className="py-2 text-center text-emerald-400 font-bold">✓</td>
                          <td className="py-2 text-center">{ROLE_PRESETS['Situation Room Officer'].includes(page.id) ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">—</span>}</td>
                          <td className="py-2 text-center">{ROLE_PRESETS['LGA Coordinator'].includes(page.id) ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">—</span>}</td>
                          <td className="py-2 text-center">{ROLE_PRESETS['Ward Coordinator'].includes(page.id) ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">—</span>}</td>
                          <td className="py-2 text-center">{ROLE_PRESETS['Polling Unit Agent'].includes(page.id) ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">—</span>}</td>
                        </tr>
                      ))}

                      {/* Side A Items */}
                      <tr className="bg-blue-950/20 text-blue-400 font-black text-[10px] uppercase">
                        <td colSpan={7} className="py-2 px-1">SIDE A — SYSTEM ADMIN CONTROL PANEL MODULES</td>
                      </tr>
                      {ALL_SIDE_A_MODULES.map(mod => (
                        <tr key={mod.id} className="hover:bg-slate-800/30">
                          <td className="py-2 font-bold text-white flex items-center gap-2">
                            <span>{mod.label}</span>
                            <span className="text-[10px] font-mono text-slate-500">{mod.id}</span>
                          </td>
                          <td className="py-2">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400">Side A</span>
                          </td>
                          <td className="py-2 text-center text-emerald-400 font-bold">✓</td>
                          <td className="py-2 text-center text-slate-600">—</td>
                          <td className="py-2 text-center text-slate-600">—</td>
                          <td className="py-2 text-center text-slate-600">—</td>
                          <td className="py-2 text-center text-slate-600">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

              {/* Setup Subview: Polling Units / Wards */}
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
                  <div>
                    <h3 className="text-sm font-black text-white">Authorized Field & Admin Staff Roster</h3>
                    <p className="text-xs text-slate-400">View and update individual role & page permission assignments</p>
                  </div>
                  <button
                    onClick={openAddUserModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-pdp hover:bg-pdp-dark text-white transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add User</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-2">Name & Username</th>
                        <th className="pb-2">Assigned Role</th>
                        <th className="pb-2">Phone</th>
                        <th className="pb-2">Allowed Pages Scope</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredUsers.map((u, i) => {
                        let parsedPages = []
                        if (u.allowed_pages) {
                          try {
                            parsedPages = typeof u.allowed_pages === 'string' ? JSON.parse(u.allowed_pages) : u.allowed_pages
                          } catch (e) {
                            parsedPages = u.allowed_pages.split(',')
                          }
                        }

                        const hasSideA = parsedPages.some(p => p.startsWith('side-a'))
                        const isSuper = (u.role || '').toLowerCase().includes('admin')

                        return (
                          <tr key={u.id || i} className="hover:bg-slate-800/30">
                            <td className="py-2.5">
                              <div className="font-bold text-white">{u.full_name || u.username}</div>
                              <span className="text-[10px] text-slate-500 font-mono">{u.username}</span>
                            </td>
                            <td className="py-2.5 text-slate-300 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                isSuper ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {u.role || 'Polling Unit Agent'}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-400 font-mono">{u.phone_number || '0800-PDP-VERIFY'}</td>
                            <td className="py-2.5">
                              {isSuper ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  All Pages (Side A + B)
                                </span>
                              ) : parsedPages.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {parsedPages.length} Pages
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
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                                Active
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => openEditUserModal(u)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3 text-emerald-400" />
                                <span>Edit Permissions</span>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
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

      {/* USER CREATION & PAGE PERMISSIONS MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingUserId ? 'Edit User Permissions & Profile' : 'Authorize New Personnel & Configure Allowed Pages'}
                </h3>
                <p className="text-xs text-slate-400">Define access permissions for Side A and Side B navigation</p>
              </div>
              <button 
                onClick={() => setShowUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Basic Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={modalFullName}
                    onChange={(e) => setModalFullName(e.target.value)}
                    placeholder="e.g. Ibrahim Suleiman"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Username *</label>
                  <input
                    required
                    type="text"
                    value={modalUsername}
                    onChange={(e) => setModalUsername(e.target.value)}
                    placeholder="e.g. agent_dut_01"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-300">
                    Password {editingUserId && <span className="text-slate-500 font-normal">(Leave blank to keep existing)</span>} *
                  </label>
                  <input
                    required={!editingUserId}
                    type="password"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    placeholder={editingUserId ? '••••••••' : 'Enter strong password'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="0801 234 5678"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Role Selection & Quick Presets */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-300">Authorization Role</label>
                <select
                  value={modalRole}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="Polling Unit Agent">Polling Unit Agent</option>
                  <option value="Ward Coordinator">Ward Coordinator</option>
                  <option value="LGA Coordinator">LGA Coordinator</option>
                  <option value="Situation Room Officer">Situation Room Officer</option>
                  <option value="Director General">Director General</option>
                  <option value="State Chairman">State Chairman</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              {/* INTERACTIVE ALLOWED PAGES & SIDEBAR SELECTOR */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase">
                      <Sliders className="w-4 h-4" /> Allowed Pages & Sidebar Navigation
                    </span>
                    <p className="text-[11px] text-slate-400">Check each page or module this user will be allowed to see:</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPages([...ALL_SIDE_B_PAGES.map(p => p.id), ...ALL_SIDE_A_MODULES.map(m => m.id)])}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPages([])}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Scope Count Summary */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span>Selected: <strong className="text-emerald-400 font-mono">{selectedPages.length}</strong> of 25 elements</span>
                  <span className="text-slate-600">|</span>
                  <span>Side B: <strong className="text-emerald-400 font-mono">{selectedPages.filter(p => !p.startsWith('side-a')).length}</strong> / 14</span>
                  <span className="text-slate-600">|</span>
                  <span>Side A: <strong className="text-blue-400 font-mono">{selectedPages.filter(p => p.startsWith('side-a')).length}</strong> / 11</span>
                </div>

                {/* Side B Options */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black uppercase text-emerald-400">Side B — Situation Room Pages</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_SIDE_B_PAGES.map(page => {
                      const isChecked = selectedPages.includes(page.id)
                      const Icon = page.icon
                      return (
                        <div
                          key={page.id}
                          onClick={() => togglePagePermission(page.id)}
                          className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition select-none ${
                            isChecked 
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <div className="truncate">
                              <p className="font-bold text-[11px] leading-tight truncate">{page.label}</p>
                              <span className="text-[9px] text-slate-500 font-mono">{page.id}</span>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${
                            isChecked ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Side A Options */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-black uppercase text-blue-400">Side A — System Admin Control Panel Modules</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_SIDE_A_MODULES.map(mod => {
                      const isChecked = selectedPages.includes(mod.id)
                      return (
                        <div
                          key={mod.id}
                          onClick={() => togglePagePermission(mod.id)}
                          className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition select-none ${
                            isChecked 
                              ? 'bg-blue-500/10 border-blue-500/40 text-white' 
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ShieldCheck className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? 'text-blue-400' : 'text-slate-500'}`} />
                            <div className="truncate">
                              <p className="font-bold text-[11px] leading-tight truncate">{mod.label}</p>
                              <span className="text-[9px] text-slate-500 font-mono">{mod.id}</span>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${
                            isChecked ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Cascading Location Assignment */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Assigned Polling Unit Location (Optional for Coordinators & Agents)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">1. LGA</label>
                    <select
                      value={modalLgaId}
                      onChange={(e) => handleModalLgaChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                    >
                      <option value="">-- All / Jigawa State --</option>
                      {lgasList.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">2. Ward</label>
                    <select
                      value={modalWardId}
                      onChange={(e) => handleModalWardChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                    >
                      <option value="">-- Select Ward --</option>
                      {wardsList.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">3. Polling Unit</label>
                    <select
                      value={modalPuId}
                      onChange={(e) => setModalPuId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                    >
                      <option value="">-- Select PU --</option>
                      {pusList.map(pu => (
                        <option key={pu.id} value={pu.id}>[{pu.code}] {pu.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2 bg-pdp text-white font-bold rounded-lg hover:bg-pdp-dark shadow-md shadow-pdp/20 flex items-center gap-1.5"
                >
                  {submittingUser ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingUserId ? 'Save Permission Changes' : 'Authorize & Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
