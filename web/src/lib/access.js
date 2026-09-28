/**
 * Access control for the web dashboard.
 *
 * Single source of truth for:
 *   - the Side A modules and Side B pages a user can be granted,
 *   - the default pages (preset) for each role,
 *   - each role's landing page after sign-in,
 *   - the per-contest election dashboards (/dashboard/<contest>).
 *
 * The backend enforces data access independently; these rules decide what
 * the dashboard shows and where users are routed.
 */
import {
  LayoutDashboard,
  Map,
  Users,
  Building2,
  AlertTriangle,
  BarChart3,
  PieChart,
  MessageSquare,
  Bell,
  UserCheck,
  Settings,
  FileText,
  Radio,
  FileSpreadsheet,
  Landmark,
  Vote,
  Layers,
  Flag,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Election contests and their dashboards
// ---------------------------------------------------------------------------

export const CONTESTS = [
  { id: 'GOVERNORSHIP', slug: 'governorship', label: 'Governorship', title: 'Governorship Dashboard', icon: Landmark },
  { id: 'SENATORIAL', slug: 'senatorial', label: 'Senatorial', title: 'Senatorial Dashboard', icon: Vote },
  { id: 'HOUSE_OF_REPS', slug: 'house-of-reps', label: 'House of Reps', title: 'House of Representatives Dashboard', icon: Building2 },
  { id: 'STATE_ASSEMBLY', slug: 'state-assembly', label: 'State Assembly', title: 'State House of Assembly Dashboard', icon: Layers },
  { id: 'PRESIDENTIAL', slug: 'presidential', label: 'Presidential', title: 'Presidential Dashboard', icon: Flag },
]

export const dashboardPath = (contest) => `/dashboard/${contest.slug}`

export const contestBySlug = (slug) => CONTESTS.find((c) => c.slug === slug) || null

const ALL_DASHBOARD_PATHS = CONTESTS.map(dashboardPath)

// ---------------------------------------------------------------------------
// Page catalog (used by the permission editors in Side A and User Management)
// ---------------------------------------------------------------------------

export const ALL_SIDE_B_PAGES = [
  { id: '/', label: 'Dashboard', group: 'Main', icon: LayoutDashboard, desc: 'Situation room live overview' },
  { id: '/map', label: 'Interactive Map', group: 'Main', icon: Map, desc: 'Geospatial results & PU pins' },
  { id: '/incidents', label: 'Incident Tracker', group: 'Main', icon: AlertTriangle, desc: 'Real-time field incident alerts' },
  { id: '/agents', label: 'Agents Directory', group: 'Main', icon: Users, desc: 'Field personnel & contact roster' },
  { id: '/polling-units', label: 'Polling Units Directory', group: 'Main', icon: Building2, desc: '4,827 Polling Unit directory' },
  ...CONTESTS.map((c) => ({
    id: dashboardPath(c),
    label: c.title,
    group: 'Election Dashboards',
    icon: c.icon,
    desc: `${c.label} results, collation and verification`,
  })),
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
  { id: 'side-a:settings', label: 'Parameters & Database Vault', group: 'Maintenance', desc: 'Backup snapshots & system parameters' },
]

export const SIDE_A_PATH = '/system-admin'

// ---------------------------------------------------------------------------
// Role presets and landing pages
// ---------------------------------------------------------------------------

const STATE_LEVEL_PAGES = [
  '/', '/map', '/incidents', '/agents', '/polling-units',
  ...ALL_DASHBOARD_PATHS,
  '/results', '/collation', '/election-results',
  '/communication', '/broadcast', '/notifications',
]

const candidatePages = (contestId) => {
  const contest = CONTESTS.find((c) => c.id === contestId)
  return [
    dashboardPath(contest), '/', '/map', '/incidents',
    '/collation', '/election-results', '/notifications',
  ]
}

/**
 * Default pages per role, used when an account has no custom page list.
 * Keys are the role names shown in the user management forms.
 */
export const ROLE_PRESETS = {
  'Super Admin': [
    ...ALL_SIDE_B_PAGES.map((p) => p.id),
    ...ALL_SIDE_A_MODULES.map((m) => m.id),
  ],
  'Situation Room Officer': STATE_LEVEL_PAGES,
  'LGA Coordinator': [
    '/collation', '/polling-units', '/results', '/incidents',
    '/communication', '/broadcast', '/notifications',
  ],
  'Ward Coordinator': [
    '/polling-units', '/results', '/incidents',
    '/communication', '/notifications',
  ],
  'Polling Unit Agent': ['/results', '/incidents', '/notifications'],
  'Director General': STATE_LEVEL_PAGES,
  'State Chairman': STATE_LEVEL_PAGES,
  'State Coordinator': STATE_LEVEL_PAGES,
  'Governorship Candidate': candidatePages('GOVERNORSHIP'),
  'Deputy Governorship Candidate': candidatePages('GOVERNORSHIP'),
  'Senatorial Candidate': candidatePages('SENATORIAL'),
  'House of Reps Candidate': candidatePages('HOUSE_OF_REPS'),
  'State Assembly Candidate': candidatePages('STATE_ASSEMBLY'),
  Observer: ['/election-results', '/notifications'],
}

const normalizeRole = (role) => (role || '').trim().toLowerCase().replace(/_/g, ' ')

const ROLE_ALIASES = {
  admin: 'Super Admin',
  analyst: 'Situation Room Officer',
  'state admin': 'Situation Room Officer',
  'house of representatives candidate': 'House of Reps Candidate',
  'lga collator': 'LGA Coordinator',
  'ward supervisor': 'Ward Coordinator',
  'polling agent': 'Polling Unit Agent',
  agent: 'Polling Unit Agent',
}

/** Canonical role name for a user, e.g. "house_of_reps candidate" -> "House of Reps Candidate". */
export function canonicalRole(user) {
  const norm = normalizeRole(user?.role)
  if (!norm) return ''
  const preset = Object.keys(ROLE_PRESETS).find((r) => normalizeRole(r) === norm)
  return preset || ROLE_ALIASES[norm] || user.role
}

export function isSuperAdmin(user) {
  return canonicalRole(user) === 'Super Admin'
}

/** The contest a candidate role belongs to, or null. */
export function candidateContest(user) {
  const pages = ROLE_PRESETS[canonicalRole(user)] || []
  if (!canonicalRole(user).endsWith('Candidate')) return null
  const path = pages.find((p) => ALL_DASHBOARD_PATHS.includes(p))
  return CONTESTS.find((c) => dashboardPath(c) === path) || null
}

/** Normalise allowed_pages (array, JSON string or comma list) to an array. */
export function parseAllowedPages(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return String(value).split(',').map((s) => s.trim()).filter(Boolean)
  }
}

/**
 * Pages granted to the user: their custom list when one is set, otherwise
 * their role preset. Unknown roles get no pages (deny by default).
 */
export function grantedPages(user) {
  if (!user) return []
  if (isSuperAdmin(user)) return ROLE_PRESETS['Super Admin']
  const custom = parseAllowedPages(user.allowed_pages)
  if (custom.length > 0) return custom
  return ROLE_PRESETS[canonicalRole(user)] || []
}

export function canAccessSideA(user) {
  return isSuperAdmin(user) || grantedPages(user).some((p) => p.startsWith('side-a'))
}

/** Whether the user may open a dashboard route (path without query string). */
export function canAccessPage(user, path) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const clean = (path || '/').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'
  if (clean === SIDE_A_PATH || clean.startsWith(`${SIDE_A_PATH}/`)) return canAccessSideA(user)
  return grantedPages(user).includes(clean)
}

// Order in which Side B pages are considered for a user's landing page.
const LANDING_PRIORITY = [
  ...ALL_DASHBOARD_PATHS,
  '/', '/collation', '/polling-units', '/results', '/incidents',
  '/election-results', '/map', '/agents', '/communication', '/broadcast',
  '/notifications', '/admin', '/settings', '/audit-logs',
]

/**
 * Where the user lands after sign-in:
 *   - Super Admin: Side A control panel.
 *   - Candidates: their contest dashboard (e.g. governorship, reps).
 *   - Everyone else: their highest-priority permitted Side B page.
 * Returns null when the account has no pages assigned.
 */
export function homePathFor(user) {
  if (!user) return '/login'
  if (isSuperAdmin(user)) return SIDE_A_PATH

  const contest = candidateContest(user)
  if (contest && canAccessPage(user, dashboardPath(contest))) return dashboardPath(contest)

  const granted = grantedPages(user)
  const landing = LANDING_PRIORITY.find((p) => granted.includes(p))
  if (landing) return landing
  if (canAccessSideA(user)) return SIDE_A_PATH
  return null
}

/** Contests whose dashboards the user may open. */
export function accessibleContests(user) {
  return CONTESTS.filter((c) => canAccessPage(user, dashboardPath(c)))
}
