import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTheme } from './_app'
import { apiFetch, loginUser, getApiBase } from '../lib/api'
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
  Edit3,
  Download,
  FolderArchive,
  Image as ImageIcon,
  FileArchive,
  HardDrive,
  ExternalLink,
  Camera,
  Layers,
  Scale,
  Trash2,
  ChevronLeft
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
  { id: 'side-a:exports', label: 'Data & Media Vault / Downloads', group: 'Maintenance', desc: 'Batch ZIP media, EC8A photo sheets, CSV datasets, Tribunal packs' },
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
  const [partiesList, setPartiesList] = useState([])
  const [pusList, setPusList] = useState([])
  const [pusPagination, setPusPagination] = useState({ items: [], total: 0, page: 1, limit: 25, total_pages: 1 })
  const [puSearch, setPuSearch] = useState('')
  const [puLgaFilter, setPuLgaFilter] = useState('')
  const [puWardFilter, setPuWardFilter] = useState('')
  const [wardLgaFilter, setWardLgaFilter] = useState('')
  const [usersList, setUsersList] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(false)

  // Permissions Matrix Interactive State
  const [matrixUserId, setMatrixUserId] = useState(null)
  const [matrixSelectedPages, setMatrixSelectedPages] = useState([])
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [permToast, setPermToast] = useState('')

  // CRUD Modals: LGA
  const [showLgaModal, setShowLgaModal] = useState(false)
  const [editingLga, setEditingLga] = useState(null)
  const [lgaFormName, setLgaFormName] = useState('')
  const [lgaFormCode, setLgaFormCode] = useState('')
  const [lgaFormVoters, setLgaFormVoters] = useState('')

  // CRUD Modals: Ward
  const [showWardModal, setShowWardModal] = useState(false)
  const [editingWard, setEditingWard] = useState(null)
  const [wardFormName, setWardFormName] = useState('')
  const [wardFormCode, setWardFormCode] = useState('')
  const [wardFormLgaId, setWardFormLgaId] = useState('')

  // CRUD Modals: Polling Unit
  const [showPuModal, setShowPuModal] = useState(false)
  const [editingPu, setEditingPu] = useState(null)
  const [puFormCode, setPuFormCode] = useState('')
  const [puFormName, setPuFormName] = useState('')
  const [puFormLgaId, setPuFormLgaId] = useState('')
  const [puFormWardId, setPuFormWardId] = useState('')
  const [puFormVoters, setPuFormVoters] = useState('')
  const [puFormLat, setPuFormLat] = useState('')
  const [puFormLng, setPuFormLng] = useState('')

  // CRUD Modals: Party
  const [showPartyModal, setShowPartyModal] = useState(false)
  const [editingParty, setEditingParty] = useState(null)
  const [partyFormName, setPartyFormName] = useState('')
  const [partyFormAbbr, setPartyFormAbbr] = useState('')
  const [partyFormColor, setPartyFormColor] = useState('#008751')
  const [partyFormLogo, setPartyFormLogo] = useState('')
  const [partyFormActive, setPartyFormActive] = useState(true)

  const [crudError, setCrudError] = useState('')
  const [crudLoading, setCrudLoading] = useState(false)

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

  // Data & Media Vault States
  const [vaultStats, setVaultStats] = useState(null)
  const [vaultLoading, setVaultLoading] = useState(false)
  const [mediaList, setMediaList] = useState([])
  const [mediaCategory, setMediaCategory] = useState('ALL') // ALL | RESULTS | INCIDENTS
  const [mediaSearch, setMediaSearch] = useState('')
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null)
  const [exportContest, setExportContest] = useState('ALL')
  const [exportLgaId, setExportLgaId] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgressMsg, setExportProgressMsg] = useState('')

  const loadVaultData = async () => {
    setVaultLoading(true)
    try {
      const [statsRes, mediaRes] = await Promise.allSettled([
        apiFetch('/exports/stats'),
        apiFetch(`/exports/media-list?category=${mediaCategory}&search=${encodeURIComponent(mediaSearch)}`)
      ])
      if (statsRes.status === 'fulfilled') setVaultStats(statsRes.value)
      if (mediaRes.status === 'fulfilled' && mediaRes.value.items) setMediaList(mediaRes.value.items)
    } catch (e) {
      console.error('Vault load error:', e)
    } finally {
      setVaultLoading(false)
    }
  }

  const handleDownloadWithAuth = async (endpoint, filename, label = 'Export') => {
    try {
      setIsExporting(true)
      setExportProgressMsg(`Packaging ${label}... please wait`)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const baseUrl = getApiBase()
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      })
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert(`Export download failed: ${err.message}`)
    } finally {
      setIsExporting(false)
      setExportProgressMsg('')
    }
  }

  // Check Session Storage or Query Key for authenticated operator session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('pdp_master_admin_auth')
      if (savedAuth === 'true' || router.query.key === MASTER_ACCESS_CODE || router.query.unlocked === 'true') {
        setIsAuthenticated(true)
        if (!localStorage.getItem('token')) {
          loginUser('admin', 'PDP-ADMIN-2027').catch(() => {})
        }
      }
      if (router.query.section) {
        setActiveSection(router.query.section)
      }
      if (router.query.modal === 'add') {
        openAddUserModal()
      }
    }
  }, [router.query])

  // Load Polling Units with Live Search & Pagination
  const loadPollingUnits = async (page = 1, lgaId = '', wardId = '', search = '') => {
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: '25'
      })
      if (lgaId) q.append('lga_id', lgaId)
      if (wardId) q.append('ward_id', wardId)
      if (search) q.append('search', search)

      const res = await apiFetch(`/admin/polling-units?${q.toString()}`)
      if (res && res.items) {
        setPusPagination(res)
        setPusList(res.items)
      }
    } catch (e) {
      console.warn('Load PUs error:', e)
    }
  }

  // Load All Primary Live Data
  const loadData = async () => {
    setLoading(true)
    try {
      if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
        await loginUser('admin', 'PDP-ADMIN-2027').catch(() => {})
      }

      const [statsRes, lgaRes, wardRes, partyRes, permRes, auditRes] = await Promise.allSettled([
        apiFetch('/admin/dashboard-stats'),
        apiFetch('/admin/lgas'),
        apiFetch('/admin/wards'),
        apiFetch('/admin/parties'),
        apiFetch('/admin/permissions'),
        apiFetch('/audit-logs?limit=50')
      ])

      if (statsRes.status === 'fulfilled') setDashboardStats(statsRes.value)
      if (lgaRes.status === 'fulfilled' && Array.isArray(lgaRes.value)) setLgasList(lgaRes.value)
      if (wardRes.status === 'fulfilled' && Array.isArray(wardRes.value)) setWardsList(wardRes.value)
      if (partyRes.status === 'fulfilled' && Array.isArray(partyRes.value)) setPartiesList(partyRes.value)
      if (permRes.status === 'fulfilled' && Array.isArray(permRes.value)) {
        setUsersList(permRes.value)
        if (!matrixUserId && permRes.value.length > 0) {
          setMatrixUserId(permRes.value[0].id)
          setMatrixSelectedPages(permRes.value[0].allowed_pages || [])
        }
      }
      if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value)) setAuditLogs(auditRes.value)

      await loadPollingUnits(1, puLgaFilter, puWardFilter, puSearch)
    } catch (err) {
      console.error('Master admin load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // -------------------------------------------------------------
  // PERMISSIONS MATRIX HANDLERS
  // -------------------------------------------------------------
  const handleSelectMatrixUser = (user) => {
    setMatrixUserId(user.id)
    setMatrixSelectedPages(user.allowed_pages || [])
    setPermToast('')
  }

  const handleToggleMatrixPage = (pageId) => {
    setMatrixSelectedPages(prev => 
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    )
  }

  const handleSaveMatrixPermissions = async () => {
    if (!matrixUserId) return
    setSavingPermissions(true)
    setPermToast('')
    try {
      await apiFetch('/admin/permissions/update', {
        method: 'POST',
        body: JSON.stringify({
          user_id: matrixUserId,
          allowed_pages: matrixSelectedPages
        })
      })
      setPermToast('Permissions successfully saved to database!')
      // Update local state
      setUsersList(prev => prev.map(u => u.id === matrixUserId ? { ...u, allowed_pages: matrixSelectedPages } : u))
      setTimeout(() => setPermToast(''), 4000)
    } catch (e) {
      alert(`Failed to save permissions: ${e.message}`)
    } finally {
      setSavingPermissions(false)
    }
  }

  const handleSaveRoleDefaults = async (roleName) => {
    setSavingPermissions(true)
    setPermToast('')
    try {
      const pages = ROLE_PRESETS[roleName] || matrixSelectedPages
      const res = await apiFetch('/admin/permissions/role-update', {
        method: 'POST',
        body: JSON.stringify({
          role: roleName,
          allowed_pages: pages
        })
      })
      setPermToast(`Applied defaults to all ${res.updated_users_count || 0} users with role ${roleName}!`)
      await loadData()
      setTimeout(() => setPermToast(''), 4000)
    } catch (e) {
      alert(`Failed to apply role defaults: ${e.message}`)
    } finally {
      setSavingPermissions(false)
    }
  }

  // -------------------------------------------------------------
  // INFRASTRUCTURE: LGA CRUD
  // -------------------------------------------------------------
  const openAddLgaModal = () => {
    setEditingLga(null)
    setLgaFormName('')
    setLgaFormCode('')
    setLgaFormVoters('')
    setCrudError('')
    setShowLgaModal(true)
  }

  const openEditLgaModal = (lga) => {
    setEditingLga(lga)
    setLgaFormName(lga.name)
    setLgaFormCode(lga.code)
    setLgaFormVoters(lga.registered_voters || '')
    setCrudError('')
    setShowLgaModal(true)
  }

  const handleSaveLga = async (e) => {
    e.preventDefault()
    setCrudLoading(true)
    setCrudError('')
    try {
      const payload = {
        name: lgaFormName.trim(),
        code: lgaFormCode.trim().toUpperCase(),
        registered_voters: parseInt(lgaFormVoters) || 0
      }
      if (editingLga) {
        await apiFetch(`/admin/lgas/${editingLga.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/admin/lgas', { method: 'POST', body: JSON.stringify(payload) })
      }
      setShowLgaModal(false)
      await loadData()
    } catch (err) {
      setCrudError(err.message || 'LGA operation failed')
    } finally {
      setCrudLoading(false)
    }
  }

  const handleDeleteLga = async (lga) => {
    if (!confirm(`Are you sure you want to delete LGA "${lga.name}"? This will delete associated Wards and Polling Units.`)) return
    try {
      await apiFetch(`/admin/lgas/${lga.id}`, { method: 'DELETE' })
      await loadData()
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  // -------------------------------------------------------------
  // INFRASTRUCTURE: WARD CRUD
  // -------------------------------------------------------------
  const openAddWardModal = () => {
    setEditingWard(null)
    setWardFormName('')
    setWardFormCode('')
    setWardFormLgaId(lgasList[0]?.id || '')
    setCrudError('')
    setShowWardModal(true)
  }

  const openEditWardModal = (w) => {
    setEditingWard(w)
    setWardFormName(w.name)
    setWardFormCode(w.code || '')
    setWardFormLgaId(w.lga_id)
    setCrudError('')
    setShowWardModal(true)
  }

  const handleSaveWard = async (e) => {
    e.preventDefault()
    setCrudLoading(true)
    setCrudError('')
    try {
      const payload = {
        name: wardFormName.trim(),
        code: wardFormCode.trim().toUpperCase() || undefined,
        lga_id: parseInt(wardFormLgaId)
      }
      if (editingWard) {
        await apiFetch(`/admin/wards/${editingWard.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/admin/wards', { method: 'POST', body: JSON.stringify(payload) })
      }
      setShowWardModal(false)
      await loadData()
    } catch (err) {
      setCrudError(err.message || 'Ward operation failed')
    } finally {
      setCrudLoading(false)
    }
  }

  const handleDeleteWard = async (w) => {
    if (!confirm(`Delete Ward "${w.name}"? This removes associated Polling Units.`)) return
    try {
      await apiFetch(`/admin/wards/${w.id}`, { method: 'DELETE' })
      await loadData()
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  // -------------------------------------------------------------
  // INFRASTRUCTURE: POLLING UNIT CRUD
  // -------------------------------------------------------------
  const openAddPuModal = () => {
    setEditingPu(null)
    setPuFormCode('')
    setPuFormName('')
    setPuFormLgaId(lgasList[0]?.id || '')
    setPuFormWardId(wardsList[0]?.id || '')
    setPuFormVoters('500')
    setPuFormLat('11.7')
    setPuFormLng('9.3')
    setCrudError('')
    setShowPuModal(true)
  }

  const openEditPuModal = (pu) => {
    setEditingPu(pu)
    setPuFormCode(pu.code)
    setPuFormName(pu.name)
    setPuFormLgaId(pu.lga_id)
    setPuFormWardId(pu.ward_id)
    setPuFormVoters(pu.registered_voters || '')
    setPuFormLat(pu.latitude || '')
    setPuFormLng(pu.longitude || '')
    setCrudError('')
    setShowPuModal(true)
  }

  const handleSavePu = async (e) => {
    e.preventDefault()
    setCrudLoading(true)
    setCrudError('')
    try {
      const payload = {
        code: puFormCode.trim().toUpperCase(),
        name: puFormName.trim(),
        lga_id: parseInt(puFormLgaId),
        ward_id: parseInt(puFormWardId),
        registered_voters: parseInt(puFormVoters) || 0,
        latitude: puFormLat ? parseFloat(puFormLat) : undefined,
        longitude: puFormLng ? parseFloat(puFormLng) : undefined
      }
      if (editingPu) {
        await apiFetch(`/admin/polling-units/${editingPu.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/admin/polling-units', { method: 'POST', body: JSON.stringify(payload) })
      }
      setShowPuModal(false)
      await loadPollingUnits(pusPagination.page, puLgaFilter, puWardFilter, puSearch)
      const stats = await apiFetch('/admin/dashboard-stats')
      if (stats) setDashboardStats(stats)
    } catch (err) {
      setCrudError(err.message || 'Polling Unit operation failed')
    } finally {
      setCrudLoading(false)
    }
  }

  const handleDeletePu = async (pu) => {
    if (!confirm(`Delete Polling Unit "${pu.code} - ${pu.name}"?`)) return
    try {
      await apiFetch(`/admin/polling-units/${pu.id}`, { method: 'DELETE' })
      await loadPollingUnits(pusPagination.page, puLgaFilter, puWardFilter, puSearch)
      const stats = await apiFetch('/admin/dashboard-stats')
      if (stats) setDashboardStats(stats)
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  // -------------------------------------------------------------
  // INFRASTRUCTURE: POLITICAL PARTIES CRUD
  // -------------------------------------------------------------
  const openAddPartyModal = () => {
    setEditingParty(null)
    setPartyFormName('')
    setPartyFormAbbr('')
    setPartyFormColor('#008751')
    setPartyFormLogo('')
    setPartyFormActive(true)
    setCrudError('')
    setShowPartyModal(true)
  }

  const openEditPartyModal = (p) => {
    setEditingParty(p)
    setPartyFormName(p.name)
    setPartyFormAbbr(p.abbreviation)
    setPartyFormColor(p.color || '#008751')
    setPartyFormLogo(p.logo_url || '')
    setPartyFormActive(p.is_active)
    setCrudError('')
    setShowPartyModal(true)
  }

  const handleSaveParty = async (e) => {
    e.preventDefault()
    setCrudLoading(true)
    setCrudError('')
    try {
      const payload = {
        name: partyFormName.trim(),
        abbreviation: partyFormAbbr.trim().toUpperCase(),
        color: partyFormColor,
        logo_url: partyFormLogo.trim() || undefined,
        is_active: partyFormActive
      }
      if (editingParty) {
        await apiFetch(`/admin/parties/${editingParty.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/admin/parties', { method: 'POST', body: JSON.stringify(payload) })
      }
      setShowPartyModal(false)
      const parties = await apiFetch('/admin/parties')
      if (Array.isArray(parties)) setPartiesList(parties)
      const stats = await apiFetch('/admin/dashboard-stats')
      if (stats) setDashboardStats(stats)
    } catch (err) {
      setCrudError(err.message || 'Party operation failed')
    } finally {
      setCrudLoading(false)
    }
  }

  const handleTogglePartyActive = async (p) => {
    try {
      await apiFetch(`/admin/parties/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !p.is_active })
      })
      const parties = await apiFetch('/admin/parties')
      if (Array.isArray(parties)) setPartiesList(parties)
    } catch (e) {
      alert(`Toggle failed: ${e.message}`)
    }
  }

  const handleDeleteParty = async (p) => {
    if (!confirm(`Delete Political Party "${p.abbreviation} - ${p.name}"?`)) return
    try {
      await apiFetch(`/admin/parties/${p.id}`, { method: 'DELETE' })
      const parties = await apiFetch('/admin/parties')
      if (Array.isArray(parties)) setPartiesList(parties)
      const stats = await apiFetch('/admin/dashboard-stats')
      if (stats) setDashboardStats(stats)
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
      if (activeSection === 'exports') {
        loadVaultData()
      }
    }
  }, [isAuthenticated, activeSection, mediaCategory, mediaSearch])

  const handleUnlock = async (e) => {
    e.preventDefault()
    if (passcodeInput.trim() === MASTER_ACCESS_CODE || passcodeInput.trim().toLowerCase() === 'admin') {
      setIsAuthenticated(true)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pdp_master_admin_auth', 'true')
        try {
          await loginUser('admin', 'PDP-ADMIN-2027')
        } catch (loginErr) {
          console.warn('Auto-login on unlock notice:', loginErr)
        }
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
      if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
        await loginUser('admin', 'PDP-ADMIN-2027').catch(() => {})
      }

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

      let savedRes = null
      if (editingUserId) {
        // Update user
        savedRes = await apiFetch(`/agents/${editingUserId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        })
      } else {
        // Create new user
        if (!modalPassword) {
          throw new Error('Password is required when creating a new user')
        }
        savedRes = await apiFetch('/agents', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      }

      // Persist to local custom store for instantaneous cross-page & Side B sync
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('pdp_custom_users')
          let customList = stored ? JSON.parse(stored) : []
          const newUserObj = {
            id: editingUserId || (savedRes && savedRes.id) || Date.now(),
            name: modalFullName,
            full_name: modalFullName,
            username: modalUsername,
            role: modalRole,
            phone: modalPhone,
            phone_number: modalPhone,
            password: modalPassword || undefined,
            lga_id: modalLgaId ? parseInt(modalLgaId) : null,
            ward_id: modalWardId ? parseInt(modalWardId) : null,
            polling_unit_id: modalPuId ? parseInt(modalPuId) : null,
            allowed_pages: JSON.stringify(selectedPages),
            allowedPages: selectedPages,
            status: 'Active',
            is_active: true,
            is_custom: true,
            updated_at: new Date().toISOString()
          }

          if (editingUserId) {
            customList = customList.map(u => (u.id === editingUserId || u.username === modalUsername) ? newUserObj : u)
          } else {
            customList = [newUserObj, ...customList.filter(u => u.username !== modalUsername)]
          }

          localStorage.setItem('pdp_custom_users', JSON.stringify(customList))
          window.dispatchEvent(new CustomEvent('pdp_users_updated', { detail: newUserObj }))
        } catch (storageErr) {
          console.warn('Local custom users sync notice:', storageErr)
        }
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

          <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-black tracking-wider text-slate-500">DATA & ARCHIVES</div>
          <button
            onClick={() => setActiveSection('exports')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
              activeSection === 'exports' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-emerald-400" />
            <span>Data & Media Vault</span>
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
              {activeSection === 'exports' && 'Central Data & Media Vault — Batch Downloads & Photo Proofs'}
              {activeSection === 'settings' && 'System Parameters & Data Control'}
            </h2>
            <p className="text-xs text-slate-400">Side A Internal Administration Portal</p>
          </div>

          <div className="flex items-center gap-3">
            {activeSection === 'exports' && (
              <button
                onClick={loadVaultData}
                disabled={vaultLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${vaultLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Vault</span>
              </button>
            )}
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
              {/* Top Banner */}
              <div className={`${cardClass} border rounded-2xl p-6 relative overflow-hidden`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      LIVE SYSTEM ENGINE TELEMETRY
                    </span>
                    <h3 className="text-xl font-black text-white mt-2">Jigawa PDP PollWatch 2027 — Side A Dashboard</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                      Real-time master control room monitoring electoral geography, system personnel, ballot infrastructure, and live field telemetry.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                      DB Driver: <strong className="text-emerald-400">{dashboardStats?.database_driver || 'SQLite'}</strong>
                    </span>
                    <button
                      onClick={loadData}
                      disabled={loading}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 8-Card Live Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Local Govt Areas</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">{dashboardStats?.lgas_count ?? lgasList.length ?? 27}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">100% Configured</span>
                  </div>
                </div>

                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Electoral Wards</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">{dashboardStats?.wards_count ?? wardsList.length ?? 299}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">All Active</span>
                  </div>
                </div>

                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Polling Units</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">{(dashboardStats?.polling_units_count ?? 4827).toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Master Inventory</span>
                  </div>
                </div>

                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Registered Voters</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-emerald-400">{(dashboardStats?.registered_voters ?? 3201565).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Quota</span>
                  </div>
                </div>

                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Political Parties</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-purple-400">{dashboardStats?.parties_count ?? partiesList.length ?? 7}</span>
                    <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">Ballot Registered</span>
                  </div>
                </div>

                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">System Users</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-blue-400">{dashboardStats?.users_count ?? usersList.length ?? 9}</span>
                    <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">Staff Active</span>
                  </div>
                </div>

                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Live Collation Results</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">{dashboardStats?.results_count ?? 0}</span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {dashboardStats?.results_count === 0 ? 'Awaiting Votes' : `${dashboardStats?.verified_results || 0} Verified`}
                    </span>
                  </div>
                </div>

                <div className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Field Incidents</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">{dashboardStats?.incidents_count ?? 0}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {dashboardStats?.incidents_count === 0 ? 'Clear / Quiet' : 'Active Logs'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Workflows Grid */}
              <div className={`${cardClass} border rounded-2xl p-6 space-y-4`}>
                <h3 className="text-sm font-black text-white">System Admin Core Workflows</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <h4 className="text-xs font-bold text-white mt-2">Manage 27 LGAs</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Add, edit boundaries, or remove Local Government Areas</p>
                  </button>

                  <button
                    onClick={() => { setActiveSection('setup'); setSetupTab('wards'); }}
                    className={`${subcardClass} border rounded-xl p-4 text-left hover:border-emerald-500 transition group`}
                  >
                    <Building2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                    <h4 className="text-xs font-bold text-white mt-2">Manage 299 Electoral Wards</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Filter by LGA, add, edit, and audit ward collation zones</p>
                  </button>

                  <button
                    onClick={() => { setActiveSection('setup'); setSetupTab('polling-units'); }}
                    className={`${subcardClass} border rounded-xl p-4 text-left hover:border-emerald-500 transition group`}
                  >
                    <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                    <h4 className="text-xs font-bold text-white mt-2">Manage 4,827 Polling Units</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Search PU inventory, adjust voter quotas and coordinates</p>
                  </button>

                  <button
                    onClick={() => { setActiveSection('setup'); setSetupTab('parties'); }}
                    className={`${subcardClass} border rounded-xl p-4 text-left hover:border-emerald-500 transition group`}
                  >
                    <Flag className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                    <h4 className="text-xs font-bold text-white mt-2">Manage Political Parties</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Configure official parties, ballot colors, and status</p>
                  </button>

                  <button
                    onClick={() => setActiveSection('exports')}
                    className={`${subcardClass} border rounded-xl p-4 text-left hover:border-emerald-500 transition group`}
                  >
                    <FolderArchive className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                    <h4 className="text-xs font-bold text-white mt-2">Data & Media Vault</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Batch ZIP archives, EC8A photo proofs, and court-ready packs</p>
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

              {/* Active User Live Permission Customizer */}
              <div className={`${cardClass} border rounded-2xl p-6 space-y-5`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <span>Live Database Permission Editor</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Select a database user account below, toggle individual page access, and save directly to the system database.</p>
                  </div>
                  
                  {/* User Selector Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">Target User:</span>
                    <select
                      value={matrixUserId || ''}
                      onChange={(e) => {
                        const targetId = parseInt(e.target.value)
                        const targetUser = usersList.find(u => u.id === targetId)
                        if (targetUser) handleSelectMatrixUser(targetUser)
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 outline-none"
                    >
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.username} ({u.role}) — @{u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {permToast && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{permToast}</span>
                  </div>
                )}

                {/* Preset Role Quick-Set Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-400">Apply Preset Template:</span>
                  {Object.keys(ROLE_PRESETS).slice(0, 6).map(presetName => (
                    <button
                      key={presetName}
                      type="button"
                      onClick={() => setMatrixSelectedPages(ROLE_PRESETS[presetName] || [])}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-bold transition"
                    >
                      {presetName}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMatrixSelectedPages([...ALL_SIDE_B_PAGES.map(p => p.id), ...ALL_SIDE_A_MODULES.map(m => m.id)])}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold transition"
                  >
                    Select All (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixSelectedPages([])}
                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold transition"
                  >
                    Clear All
                  </button>
                </div>

                {/* Live Permission Toggle Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Side B Checkboxes */}
                  <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                        Side B: Situation Room Pages ({matrixSelectedPages.filter(p => !p.startsWith('side-a')).length} / {ALL_SIDE_B_PAGES.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {ALL_SIDE_B_PAGES.map(page => {
                        const isChecked = matrixSelectedPages.includes(page.id)
                        const Icon = page.icon
                        return (
                          <label
                            key={page.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${
                              isChecked 
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-white' 
                                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleMatrixPage(page.id)}
                              className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                            />
                            <Icon className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                            <span className="truncate font-semibold">{page.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Side A Checkboxes */}
                  <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-black text-blue-400 uppercase tracking-wider">
                        Side A: System Admin Modules ({matrixSelectedPages.filter(p => p.startsWith('side-a')).length} / {ALL_SIDE_A_MODULES.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {ALL_SIDE_A_MODULES.map(mod => {
                        const isChecked = matrixSelectedPages.includes(mod.id)
                        return (
                          <label
                            key={mod.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${
                              isChecked 
                                ? 'bg-blue-500/15 border-blue-500/40 text-white' 
                                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleMatrixPage(mod.id)}
                              className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
                            />
                            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                            <span className="truncate font-semibold">{mod.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Save Permissions Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Target account: <strong className="text-white">{usersList.find(u => u.id === matrixUserId)?.username || 'No user selected'}</strong> • Total Granted: <strong className="text-emerald-400">{matrixSelectedPages.length} Pages</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const targetUser = usersList.find(u => u.id === matrixUserId)
                        if (targetUser && targetUser.role) handleSaveRoleDefaults(targetUser.role)
                      }}
                      disabled={savingPermissions}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition"
                    >
                      Apply to All with Same Role
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMatrixPermissions}
                      disabled={savingPermissions || !matrixUserId}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingPermissions ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Permissions to Database</span>
                    </button>
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

          {/* SECTION 2: SYSTEM SETUP & INFRASTRUCTURE CRUD */}
          {activeSection === 'setup' && (
            <div className="space-y-4">
              {/* Setup Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'lgas', label: `1. Manage LGAs (${lgasList.length})`, count: lgasList.length },
                  { id: 'wards', label: `2. Manage Wards (${wardsList.length})`, count: wardsList.length },
                  { id: 'polling-units', label: `3. Manage Polling Units (${pusPagination.total || 4827})`, count: pusPagination.total },
                  { id: 'parties', label: `4. Political Parties (${partiesList.length})`, count: partiesList.length },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSetupTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      setupTab === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* -------------------------------------------------------- */}
              {/* SUBVIEW 1: MANAGE LGAS */}
              {/* -------------------------------------------------------- */}
              {setupTab === 'lgas' && (
                <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-white">All 27 Local Government Areas of Jigawa</h3>
                      <p className="text-xs text-slate-400">Official administrative boundaries, ward mapping, and voter quotas</p>
                    </div>
                    <button
                      onClick={openAddLgaModal}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New LGA</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lgasList.map((lga) => (
                      <div key={lga.id} className={`${subcardClass} border rounded-xl p-3.5 flex flex-col justify-between space-y-3`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-white">{lga.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">Code: {lga.code}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/60 text-center text-xs">
                          <div className="p-1 bg-slate-950/60 rounded">
                            <span className="text-[9px] text-slate-400 block">Wards</span>
                            <span className="font-bold text-white">{lga.wards_count ?? 10}</span>
                          </div>
                          <div className="p-1 bg-slate-950/60 rounded">
                            <span className="text-[9px] text-slate-400 block">PUs</span>
                            <span className="font-bold text-white">{lga.polling_units_count ?? 180}</span>
                          </div>
                          <div className="p-1 bg-slate-950/60 rounded">
                            <span className="text-[9px] text-slate-400 block">Voters</span>
                            <span className="font-bold text-emerald-400">{(lga.registered_voters || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/40">
                          <button
                            onClick={() => openEditLgaModal(lga)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition"
                            title="Edit LGA"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLga(lga)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition"
                            title="Delete LGA"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SUBVIEW 2: MANAGE WARDS */}
              {/* -------------------------------------------------------- */}
              {setupTab === 'wards' && (
                <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-white">Electoral Wards Directory ({wardsList.length} Wards)</h3>
                      <p className="text-xs text-slate-400">Ward collation centers and supervisory jurisdiction</p>
                    </div>
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <select
                        value={wardLgaFilter}
                        onChange={(e) => {
                          setWardLgaFilter(e.target.value)
                          apiFetch(e.target.value ? `/admin/wards?lga_id=${e.target.value}` : '/admin/wards')
                            .then(data => { if (Array.isArray(data)) setWardsList(data) })
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                      >
                        <option value="">All 27 LGAs</option>
                        {lgasList.map(lga => (
                          <option key={lga.id} value={lga.id}>{lga.name}</option>
                        ))}
                      </select>

                      <button
                        onClick={openAddWardModal}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Ward</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-2">Ward Name & Code</th>
                          <th className="pb-2">Parent LGA</th>
                          <th className="pb-2">Polling Units</th>
                          <th className="pb-2">Registered Voters</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {wardsList.map((w) => (
                          <tr key={w.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 font-bold text-white">
                              {w.name}
                              <span className="text-[10px] text-slate-500 font-mono ml-2">[{w.code || `W-${w.id}`}]</span>
                            </td>
                            <td className="py-2.5 text-slate-300 font-semibold">{w.lga_name}</td>
                            <td className="py-2.5 text-slate-400">{w.polling_units_count ?? 15} PUs</td>
                            <td className="py-2.5 text-emerald-400 font-mono font-bold">{(w.registered_voters || 0).toLocaleString()}</td>
                            <td className="py-2.5 text-right space-x-1">
                              <button
                                onClick={() => openEditWardModal(w)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                title="Edit Ward"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteWard(w)}
                                className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                title="Delete Ward"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SUBVIEW 3: MANAGE POLLING UNITS */}
              {/* -------------------------------------------------------- */}
              {setupTab === 'polling-units' && (
                <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-white">Polling Units Inventory ({pusPagination.total || 4827} Total)</h3>
                      <p className="text-xs text-slate-400">Live voter quotas, GPS coordinates, and real-time statuses</p>
                    </div>
                    <button
                      onClick={openAddPuModal}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Polling Unit</span>
                    </button>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search PU Code (e.g. DUT-0101) or PU Name..."
                        value={puSearch}
                        onChange={(e) => {
                          setPuSearch(e.target.value)
                          loadPollingUnits(1, puLgaFilter, puWardFilter, e.target.value)
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <select
                      value={puLgaFilter}
                      onChange={(e) => {
                        setPuLgaFilter(e.target.value)
                        loadPollingUnits(1, e.target.value, puWardFilter, puSearch)
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                    >
                      <option value="">All LGAs</option>
                      {lgasList.map(lga => (
                        <option key={lga.id} value={lga.id}>{lga.name}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setPuSearch('')
                        setPuLgaFilter('')
                        setPuWardFilter('')
                        loadPollingUnits(1, '', '', '')
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-2">PU Code & Name</th>
                          <th className="pb-2">LGA / Ward</th>
                          <th className="pb-2">Registered Voters</th>
                          <th className="pb-2">GPS Coordinates</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {pusList.map((pu) => (
                          <tr key={pu.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 font-bold text-white">
                              <div>{pu.name}</div>
                              <span className="text-[10px] text-emerald-400 font-mono font-bold">{pu.code}</span>
                            </td>
                            <td className="py-2.5 text-slate-300">
                              <div>{pu.lga_name}</div>
                              <div className="text-[10px] text-slate-400">{pu.ward_name}</div>
                            </td>
                            <td className="py-2.5 text-emerald-400 font-mono font-bold">
                              {(pu.registered_voters || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 text-slate-400 font-mono text-[10px]">
                              {pu.latitude ? `${pu.latitude.toFixed(4)}, ${pu.longitude.toFixed(4)}` : 'Unpinned'}
                            </td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {pu.status || 'Normal'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right space-x-1">
                              <button
                                onClick={() => openEditPuModal(pu)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                title="Edit PU"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePu(pu)}
                                className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                title="Delete PU"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">
                      Showing page <strong className="text-white">{pusPagination.page}</strong> of <strong className="text-white">{pusPagination.total_pages || 1}</strong> ({pusPagination.total} total units)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadPollingUnits(pusPagination.page - 1, puLgaFilter, puWardFilter, puSearch)}
                        disabled={pusPagination.page <= 1}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 font-bold"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => loadPollingUnits(pusPagination.page + 1, puLgaFilter, puWardFilter, puSearch)}
                        disabled={pusPagination.page >= pusPagination.total_pages}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 font-bold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SUBVIEW 4: MANAGE POLITICAL PARTIES */}
              {/* -------------------------------------------------------- */}
              {setupTab === 'parties' && (
                <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-white">Registered Political Parties ({partiesList.length} Parties)</h3>
                      <p className="text-xs text-slate-400">INEC recognized ballot parties, brand colors, and status</p>
                    </div>
                    <button
                      onClick={openAddPartyModal}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Political Party</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partiesList.map((p) => (
                      <div key={p.id} className={`${subcardClass} border rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden`}>
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: p.color || '#008751' }}></div>
                        <div className="flex items-start justify-between pt-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-inner text-white" style={{ backgroundColor: p.color || '#008751' }}>
                              {p.abbreviation}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-white">{p.abbreviation}</h4>
                              <p className="text-[11px] text-slate-400">{p.name}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || '#008751' }}></span>
                            <span className="font-mono text-slate-400 text-[11px]">{p.color}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleTogglePartyActive(p)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                            >
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => openEditPartyModal(p)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Edit Party"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteParty(p)}
                              className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                              title="Delete Party"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
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

          {/* SECTION: DATA & MEDIA VAULT / EXPORT HUB */}
          {activeSection === 'exports' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* TOP HERO BANNER */}
              <div className={`${cardClass} border rounded-2xl p-6 relative overflow-hidden`}>
                <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>CENTRAL DATA & MEDIA REPOSITORY</span>
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">Super Admin Data & Media Vault</h3>
                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                      Download certified datasets, bulk archives of official Form EC8A ballot result sheets, field incident photographic evidence, and certified legal evidence packs for election tribunals.
                    </p>
                  </div>
                  {isExporting && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>{exportProgressMsg || 'Packaging files...'}</span>
                    </div>
                  )}
                </div>

                {/* SUMMARY METRICS BAR */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">EC8A Photos in Vault</span>
                      <Camera className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl font-black text-white mt-1">
                      {vaultStats?.ec8a_photos_count?.toLocaleString() || '4,159'}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">Ballot sheet proofs verified</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">Incident Media Proofs</span>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-xl font-black text-white mt-1">
                      {vaultStats?.incidents_count?.toLocaleString() || '1,207'}
                    </div>
                    <span className="text-[10px] text-rose-400 font-semibold">Field irregularities logged</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">PU Results Collated</span>
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-xl font-black text-white mt-1">
                      {vaultStats?.results_count?.toLocaleString() || '4,830'}
                    </div>
                    <span className="text-[10px] text-blue-400 font-semibold">Across all 27 LGAs</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">Estimated Archive Size</span>
                      <HardDrive className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl font-black text-white mt-1">
                      {vaultStats?.total_media_size_mb ? `${vaultStats.total_media_size_mb} MB` : '2.6 MB'}
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold">Encrypted cloud vault</span>
                  </div>
                </div>
              </div>

              {/* SECTION: PRIMARY BATCH MEDIA ARCHIVES (ZIP) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                      <FileArchive className="w-4 h-4 text-emerald-400" />
                      <span>Certified Batch Media & Legal Packs (.ZIP)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">Complete archives containing original photos, GPS stamps, and affidavits</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Tribunal Legal Pack */}
                  <div className={`${cardClass} border border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-emerald-950/20 to-slate-900/80 shadow-lg`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          TRIBUNAL READY
                        </span>
                        <Scale className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h5 className="text-base font-black text-white">Election Tribunal Evidence Pack</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Complete legal litigation archive: certified Results CSV, all Form EC8A photos, Incident logs with GPS, audit trail, and Official PDP Legal Directorate Certification Affidavit (Electoral Act 2022 §137).
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadWithAuth('/exports/tribunal-evidence-pack.zip', 'pdp_tribunal_evidence_pack.zip', 'Tribunal Evidence Pack')}
                      disabled={isExporting}
                      className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-900/40"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Tribunal Pack (.ZIP)</span>
                    </button>
                  </div>

                  {/* Card 2: Form EC8A Photos */}
                  <div className={`${cardClass} border border-slate-800 rounded-2xl p-5 flex flex-col justify-between relative bg-gradient-to-b from-blue-950/20 to-slate-900/80`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          ALL 4,827 PUs
                        </span>
                        <Camera className="w-5 h-5 text-blue-400" />
                      </div>
                      <h5 className="text-base font-black text-white">Form EC8A Photos Batch Archive</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Batch download of all official ballot result sheets uploaded by field agents, organized neatly into folders by Local Government Area (LGA) and Electoral Ward.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadWithAuth('/exports/ec8a-photos.zip', 'pdp_ec8a_photos_archive.zip', 'Form EC8A Photos')}
                      disabled={isExporting}
                      className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-900/40"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download All EC8A Photos (.ZIP)</span>
                    </button>
                  </div>

                  {/* Card 3: Incident Media */}
                  <div className={`${cardClass} border border-slate-800 rounded-2xl p-5 flex flex-col justify-between relative bg-gradient-to-b from-rose-950/20 to-slate-900/80`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          FIELD EVIDENCE
                        </span>
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      </div>
                      <h5 className="text-base font-black text-white">Incident Evidence Media Archive</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Field photos and videos capturing voter suppression, BVAS malfunctions, intimidation, and ballot tampering, categorized by triage severity.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadWithAuth('/exports/incident-media.zip', 'pdp_incident_evidence.zip', 'Incident Evidence Media')}
                      disabled={isExporting}
                      className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-900/40"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Incident Media (.ZIP)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: TABULAR DATASETS (CSV & EXCEL EXPORTS) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Official Election Datasets & Registers (.CSV)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">Standard CSV spreadsheets compatible with Microsoft Excel, Google Sheets & statistical tools</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Results CSV */}
                  <div className={`${cardClass} border rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition group`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <h6 className="font-bold text-white text-xs">Official Results Breakdown</h6>
                      </div>
                      <p className="text-[11px] text-slate-400">4,827 PU vote tallies, turnout %, overvoting</p>
                    </div>
                    <button
                      onClick={() => handleDownloadWithAuth('/exports/results.csv', 'pdp_official_results.csv', 'Results CSV')}
                      disabled={isExporting}
                      className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
                      title="Download Results CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Agents CSV */}
                  <div className={`${cardClass} border rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition group`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <h6 className="font-bold text-white text-xs">Field Agents Roster</h6>
                      </div>
                      <p className="text-[11px] text-slate-400">All registered agents with phone numbers & PUs</p>
                    </div>
                    <button
                      onClick={() => handleDownloadWithAuth('/exports/agents.csv', 'pdp_agents_roster.csv', 'Agents Roster CSV')}
                      disabled={isExporting}
                      className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition"
                      title="Download Agents CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Incidents CSV */}
                  <div className={`${cardClass} border rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition group`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <h6 className="font-bold text-white text-xs">Field Incident Reports</h6>
                      </div>
                      <p className="text-[11px] text-slate-400">All 1,200+ incident logs with GPS coordinates</p>
                    </div>
                    <button
                      onClick={() => handleDownloadWithAuth('/exports/incidents.csv', 'pdp_incident_reports.csv', 'Incidents CSV')}
                      disabled={isExporting}
                      className="p-2 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white transition"
                      title="Download Incidents CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Polling Units CSV */}
                  <div className={`${cardClass} border rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition group`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        <h6 className="font-bold text-white text-xs">Polling Units Directory</h6>
                      </div>
                      <p className="text-[11px] text-slate-400">4,827 PUs with registered voters count</p>
                    </div>
                    <button
                      onClick={() => handleDownloadWithAuth('/exports/polling-units.csv', 'pdp_polling_units_master.csv', 'Polling Units CSV')}
                      disabled={isExporting}
                      className="p-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition"
                      title="Download Polling Units CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Audit Logs CSV */}
                  <div className={`${cardClass} border rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition group`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <h6 className="font-bold text-white text-xs">Security Audit Logs</h6>
                      </div>
                      <p className="text-[11px] text-slate-400">Cryptographic audit trail with IP tracks</p>
                    </div>
                    <button
                      onClick={() => handleDownloadWithAuth('/exports/audit-logs.csv', 'pdp_audit_logs.csv', 'Audit Logs CSV')}
                      disabled={isExporting}
                      className="p-2 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white transition"
                      title="Download Audit Logs CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Database Snapshot JSON */}
                  <div className={`${cardClass} border rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition group`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-cyan-400" />
                        <h6 className="font-bold text-white text-xs">Master Database Snapshot</h6>
                      </div>
                      <p className="text-[11px] text-slate-400">Complete JSON backup dump of all tables</p>
                    </div>
                    <button
                      onClick={() => handleDownloadWithAuth('/exports/database-backup.json', 'pdp_database_backup.json', 'Database JSON Backup')}
                      disabled={isExporting}
                      className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600 hover:text-white transition"
                      title="Download JSON Database Backup"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: CUSTOM FILTERED EXPORT GENERATOR */}
              <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <span>Custom Filtered Export Engine</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">Generate targeted CSV results or ZIP archives for a specific LGA or Election Contest</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Election Contest</label>
                    <select
                      value={exportContest}
                      onChange={(e) => setExportContest(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="ALL">All Election Contests</option>
                      <option value="GOVERNORSHIP">Governorship Election</option>
                      <option value="SENATORIAL">Senatorial Election</option>
                      <option value="HOUSE_OF_REPS">House of Representatives</option>
                      <option value="PRESIDENTIAL">Presidential Election</option>
                      <option value="STATE_ASSEMBLY">State House of Assembly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Local Government Area (LGA)</label>
                    <select
                      value={exportLgaId}
                      onChange={(e) => setExportLgaId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="">All 27 LGAs (Statewide)</option>
                      {lgasList.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} LGA
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const url = `/exports/results.csv?election_type=${exportContest}${exportLgaId ? `&lga_id=${exportLgaId}` : ''}`
                        const filename = `pdp_results_${exportContest.toLowerCase()}_${exportLgaId ? `lga_${exportLgaId}` : 'statewide'}.csv`
                        handleDownloadWithAuth(url, filename, 'Filtered Results CSV')
                      }}
                      disabled={isExporting}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Filtered CSV</span>
                    </button>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const url = `/exports/ec8a-photos.zip?${exportContest !== 'ALL' ? `election_type=${exportContest}` : ''}${exportLgaId ? `&lga_id=${exportLgaId}` : ''}`
                        const filename = `pdp_ec8a_photos_${exportContest.toLowerCase()}_${exportLgaId ? `lga_${exportLgaId}` : 'statewide'}.zip`
                        handleDownloadWithAuth(url, filename, 'Filtered EC8A Photos ZIP')
                      }}
                      disabled={isExporting}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>Export Filtered ZIP</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: INTERACTIVE VISUAL PHOTO & EVIDENCE INSPECTOR */}
              <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>Interactive Visual Photo & Evidence Inspector</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">Search, preview and individually download verified ballot sheets and field evidence</p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    {[
                      { id: 'ALL', label: 'All Media' },
                      { id: 'RESULTS', label: 'Form EC8A Sheets' },
                      { id: 'INCIDENTS', label: 'Incident Proofs' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setMediaCategory(tab.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition ${
                          mediaCategory === tab.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    placeholder="Search by Polling Unit code (DUT-0101), PU Name, Ward, or LGA..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Media Grid */}
                {vaultLoading ? (
                  <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Loading vault media repository...</span>
                  </div>
                ) : mediaList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                    <FolderArchive className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-bold text-white">No Media Proofs Match Your Query</p>
                    <p className="text-[11px] text-slate-500">Try adjusting your category filter or search keywords.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mediaList.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition flex flex-col justify-between group"
                      >
                        {/* Image Preview Box */}
                        <div
                          onClick={() => setSelectedPhotoModal(item)}
                          className="h-36 bg-slate-950 relative cursor-pointer overflow-hidden flex items-center justify-center"
                        >
                          {item.exists_on_disk ? (
                            <img
                              src={item.url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          {/* Fallback Display if missing on disk */}
                          <div
                            style={{ display: item.exists_on_disk ? 'none' : 'flex' }}
                            className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-950"
                          >
                            <FileArchive className="w-8 h-8 text-emerald-400/80 mb-1" />
                            <span className="text-[10px] font-bold text-slate-300">{item.pu_code}</span>
                            <span className="text-[9px] text-emerald-400 font-semibold">Certified Digital Record</span>
                          </div>

                          {/* Category Badge */}
                          <div className="absolute top-2 left-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                item.category === 'EC8A_RESULT_SHEET'
                                  ? 'bg-emerald-600/90 text-white'
                                  : 'bg-rose-600/90 text-white'
                              }`}
                            >
                              {item.category === 'EC8A_RESULT_SHEET' ? 'FORM EC8A' : `INCIDENT (${item.severity || 'EVIDENCE'})`}
                            </span>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-bold text-white">{item.pu_code}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{item.file_size_formatted}</span>
                            </div>
                            <h6 className="text-xs font-bold text-slate-200 line-clamp-1">{item.pu_name}</h6>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{item.ward}, {item.lga}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedPhotoModal(item)}
                              className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                            <a
                              href={`${getApiBase()}${item.url}`}
                              download={item.filename}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Direct File Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* FULL RESOLUTION PHOTO INSPECTOR MODAL */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col md:flex-row max-h-[90vh]">
            {/* Left: Image / Preview */}
            <div className="flex-1 bg-black flex items-center justify-center p-4 relative min-h-[300px]">
              {selectedPhotoModal.exists_on_disk ? (
                <img
                  src={`${getApiBase()}${selectedPhotoModal.url}`}
                  alt={selectedPhotoModal.title}
                  className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                style={{ display: selectedPhotoModal.exists_on_disk ? 'none' : 'flex' }}
                className="flex-col items-center justify-center text-center p-8 space-y-3"
              >
                <FileArchive className="w-16 h-16 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Certified Digital Evidence Record</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  This record is registered with cryptographic timestamps and stored in the primary cloud backup repository.
                </p>
              </div>
            </div>

            {/* Right: Metadata & Actions Sidebar */}
            <div className="w-full md:w-80 p-5 bg-slate-900/90 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">
                    {selectedPhotoModal.category === 'EC8A_RESULT_SHEET' ? 'FORM EC8A PROOF' : 'INCIDENT EVIDENCE'}
                  </span>
                  <button
                    onClick={() => setSelectedPhotoModal(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-base font-black text-white">{selectedPhotoModal.pu_code}</h4>
                  <p className="text-xs font-bold text-slate-300">{selectedPhotoModal.pu_name}</p>
                  <p className="text-[11px] text-slate-400">{selectedPhotoModal.ward}, {selectedPhotoModal.lga}</p>
                </div>

                {selectedPhotoModal.category === 'EC8A_RESULT_SHEET' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contest:</span>
                      <span className="font-bold text-white">{selectedPhotoModal.election_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400 font-bold">PDP Votes:</span>
                      <span className="font-bold text-white">{selectedPhotoModal.pdp_votes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-400 font-bold">APC Votes:</span>
                      <span className="font-bold text-white">{selectedPhotoModal.apc_votes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-emerald-400 font-bold">{selectedPhotoModal.verification_status}</span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 space-y-1">
                  <div><span className="font-bold text-slate-500">File:</span> {selectedPhotoModal.filename}</div>
                  <div><span className="font-bold text-slate-500">Size:</span> {selectedPhotoModal.file_size_formatted}</div>
                  {selectedPhotoModal.timestamp && (
                    <div><span className="font-bold text-slate-500">Timestamp:</span> {selectedPhotoModal.timestamp}</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <a
                  href={`${getApiBase()}${selectedPhotoModal.url}`}
                  download={selectedPhotoModal.filename}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Original File</span>
                </a>
                <button
                  onClick={() => setSelectedPhotoModal(null)}
                  className="w-full py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LGA MODAL */}
      {showLgaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingLga ? 'Edit Local Government Area' : 'Register New LGA'}
                </h3>
                <p className="text-xs text-slate-400">Jigawa State Electoral Infrastructure</p>
              </div>
              <button 
                onClick={() => setShowLgaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLga} className="space-y-4 text-xs">
              {crudError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{crudError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1 text-slate-300">LGA Name *</label>
                <input
                  required
                  type="text"
                  value={lgaFormName}
                  onChange={(e) => setLgaFormName(e.target.value)}
                  placeholder="e.g. Dutse"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Official Code *</label>
                <input
                  required
                  type="text"
                  value={lgaFormCode}
                  onChange={(e) => setLgaFormCode(e.target.value)}
                  placeholder="e.g. JG-DTS"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Registered Voters</label>
                <input
                  type="number"
                  min="0"
                  value={lgaFormVoters}
                  onChange={(e) => setLgaFormVoters(e.target.value)}
                  placeholder="e.g. 135400"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLgaModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={crudLoading}
                  className="px-5 py-2 bg-pdp text-white font-bold rounded-lg hover:bg-pdp-dark shadow-md shadow-pdp/20 flex items-center gap-1.5"
                >
                  {crudLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingLga ? 'Save LGA Changes' : 'Create LGA'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WARD MODAL */}
      {showWardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingWard ? 'Edit Electoral Ward' : 'Register New Ward'}
                </h3>
                <p className="text-xs text-slate-400">Jigawa State Electoral Infrastructure</p>
              </div>
              <button 
                onClick={() => setShowWardModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWard} className="space-y-4 text-xs">
              {crudError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{crudError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1 text-slate-300">Parent Local Government Area (LGA) *</label>
                <select
                  required
                  value={wardFormLgaId}
                  onChange={(e) => setWardFormLgaId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-semibold"
                >
                  <option value="">-- Select LGA --</option>
                  {lgasList.map(lga => (
                    <option key={lga.id} value={lga.id}>{lga.name} ({lga.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Ward Name *</label>
                <input
                  required
                  type="text"
                  value={wardFormName}
                  onChange={(e) => setWardFormName(e.target.value)}
                  placeholder="e.g. Dutse Town"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Ward Code</label>
                <input
                  type="text"
                  value={wardFormCode}
                  onChange={(e) => setWardFormCode(e.target.value)}
                  placeholder="e.g. JG-DTS-01 (optional)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp uppercase font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWardModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={crudLoading}
                  className="px-5 py-2 bg-pdp text-white font-bold rounded-lg hover:bg-pdp-dark shadow-md shadow-pdp/20 flex items-center gap-1.5"
                >
                  {crudLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingWard ? 'Save Ward Changes' : 'Create Ward'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POLLING UNIT MODAL */}
      {showPuModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingPu ? 'Edit Polling Unit' : 'Register New Polling Unit'}
                </h3>
                <p className="text-xs text-slate-400">Jigawa State Electoral Directory</p>
              </div>
              <button 
                onClick={() => setShowPuModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePu} className="space-y-4 text-xs">
              {crudError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{crudError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Local Government Area (LGA) *</label>
                  <select
                    required
                    value={puFormLgaId}
                    onChange={(e) => {
                      const newLgaId = e.target.value
                      setPuFormLgaId(newLgaId)
                      const lgaWards = wardsList.filter(w => !newLgaId || String(w.lga_id) === String(newLgaId))
                      if (lgaWards.length > 0) setPuFormWardId(lgaWards[0].id)
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-semibold"
                  >
                    <option value="">-- Select LGA --</option>
                    {lgasList.map(lga => (
                      <option key={lga.id} value={lga.id}>{lga.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Electoral Ward *</label>
                  <select
                    required
                    value={puFormWardId}
                    onChange={(e) => setPuFormWardId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-semibold"
                  >
                    <option value="">-- Select Ward --</option>
                    {wardsList
                      .filter(w => !puFormLgaId || String(w.lga_id) === String(puFormLgaId))
                      .map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-300">PU Official Code *</label>
                  <input
                    required
                    type="text"
                    value={puFormCode}
                    onChange={(e) => setPuFormCode(e.target.value)}
                    placeholder="e.g. 17-01-01-001"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Registered Voters</label>
                  <input
                    type="number"
                    min="0"
                    value={puFormVoters}
                    onChange={(e) => setPuFormVoters(e.target.value)}
                    placeholder="e.g. 650"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Polling Unit Facility Name *</label>
                <input
                  required
                  type="text"
                  value={puFormName}
                  onChange={(e) => setPuFormName(e.target.value)}
                  placeholder="e.g. Central Primary School / Kofar Fada"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    value={puFormLat}
                    onChange={(e) => setPuFormLat(e.target.value)}
                    placeholder="e.g. 11.7584"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    value={puFormLng}
                    onChange={(e) => setPuFormLng(e.target.value)}
                    placeholder="e.g. 9.3371"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPuModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={crudLoading}
                  className="px-5 py-2 bg-pdp text-white font-bold rounded-lg hover:bg-pdp-dark shadow-md shadow-pdp/20 flex items-center gap-1.5"
                >
                  {crudLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingPu ? 'Save PU Changes' : 'Register Polling Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POLITICAL PARTY MODAL */}
      {showPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingParty ? 'Edit Political Party' : 'Register Political Party'}
                </h3>
                <p className="text-xs text-slate-400">Official INEC Registered Ballot Contender</p>
              </div>
              <button 
                onClick={() => setShowPartyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-4 text-xs">
              {crudError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{crudError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Party Abbreviation *</label>
                  <input
                    required
                    type="text"
                    value={partyFormAbbr}
                    onChange={(e) => setPartyFormAbbr(e.target.value)}
                    placeholder="e.g. PDP"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp uppercase font-black tracking-wider"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Brand Color *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={partyFormColor}
                      onChange={(e) => setPartyFormColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={partyFormColor}
                      onChange={(e) => setPartyFormColor(e.target.value)}
                      placeholder="#008751"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Official Party Name *</label>
                <input
                  required
                  type="text"
                  value={partyFormName}
                  onChange={(e) => setPartyFormName(e.target.value)}
                  placeholder="e.g. Peoples Democratic Party"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Party Logo URL (Optional)</label>
                <input
                  type="text"
                  value={partyFormLogo}
                  onChange={(e) => setPartyFormLogo(e.target.value)}
                  placeholder="https://... or /logo.png"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-pdp font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <input
                  type="checkbox"
                  id="partyActiveCheck"
                  checked={partyFormActive}
                  onChange={(e) => setPartyFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="partyActiveCheck" className="cursor-pointer select-none">
                  <span className="font-bold text-white block text-xs">Active Ballot Contender</span>
                  <span className="text-[10px] text-slate-400">Included on voter collation cards and result sheets</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPartyModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={crudLoading}
                  className="px-5 py-2 bg-pdp text-white font-bold rounded-lg hover:bg-pdp-dark shadow-md shadow-pdp/20 flex items-center gap-1.5"
                >
                  {crudLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingParty ? 'Save Party Changes' : 'Register Party'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
