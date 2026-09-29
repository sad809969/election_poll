/**
 * Access control for the web dashboard.
 *
 * The backend must independently enforce data access.
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
  Settings,
  FileText,
  Radio,
  FileSpreadsheet,
  Landmark,
  Vote,
  Layers,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Election contests and their dashboards
// ---------------------------------------------------------------------------

export const CONTESTS = [
  {
    id: 'GOVERNORSHIP',
    slug: 'governorship',
    label: 'Governorship',
    title: 'Governor Dashboard',
    icon: Landmark,
  },
  {
    id: 'SENATORIAL',
    slug: 'senatorial',
    label: 'Senate',
    title: 'Senate Dashboard',
    icon: Vote,
  },
  {
    id: 'HOUSE_OF_REPS',
    slug: 'house-of-reps',
    label: 'House of Representatives',
    title: 'House of Representatives Dashboard',
    icon: Building2,
  },
  {
    id: 'STATE_ASSEMBLY',
    slug: 'state-assembly',
    label: 'House of Assembly',
    title: 'House of Assembly Dashboard',
    icon: Layers,
  },
]

export const dashboardPath = (contest) =>
  `/dashboard/${contest.slug}`

export const contestBySlug = (slug) =>
  CONTESTS.find((contest) => contest.slug === slug) || null

const ALL_DASHBOARD_PATHS = CONTESTS.map(dashboardPath)

// ---------------------------------------------------------------------------
// Page catalog
// ---------------------------------------------------------------------------

export const ALL_SIDE_B_PAGES = [
  {
    id: '/',
    label: 'Dashboard',
    group: 'Main',
    icon: LayoutDashboard,
    desc: 'Situation room overview',
  },
  {
    id: '/map',
    label: 'Interactive Map',
    group: 'Main',
    icon: Map,
    desc: 'Geospatial monitoring',
  },
  {
    id: '/incidents',
    label: 'Incident Tracker',
    group: 'Main',
    icon: AlertTriangle,
    desc: 'Field incident reports',
  },
  {
    id: '/agents',
    label: 'Agents Directory',
    group: 'Main',
    icon: Users,
    desc: 'Field personnel and assignments',
  },
  {
    id: '/polling-units',
    label: 'Polling Units Directory',
    group: 'Main',
    icon: Building2,
    desc: 'Polling unit records',
  },

  ...CONTESTS.map((contest) => ({
    id: dashboardPath(contest),
    label: contest.title,
    group: 'Election Dashboards',
    icon: contest.icon,
    desc: `${contest.label} monitoring, results and verification`,
  })),

  {
    id: '/results',
    label: 'Results Dashboard',
    group: 'Results',
    icon: BarChart3,
    desc: 'Results submissions',
  },
  {
    id: '/collation',
    label: 'Collation Center',
    group: 'Results',
    icon: PieChart,
    desc: 'Ward, LGA and state collation',
  },
  {
    id: '/election-results',
    label: 'Results by Office & Export',
    group: 'Results',
    icon: FileSpreadsheet,
    desc: 'Election results breakdown and export',
  },
  {
    id: '/communication',
    label: 'Communication Center',
    group: 'Communication',
    icon: MessageSquare,
    desc: 'Two-way messaging',
  },
  {
    id: '/broadcast',
    label: 'Broadcast Messages',
    group: 'Communication',
    icon: Radio,
    desc: 'Broadcast alerts',
  },
  {
    id: '/notifications',
    label: 'Notifications',
    group: 'Communication',
    icon: Bell,
    desc: 'System notifications',
  },
  {
    id: '/settings',
    label: 'System Settings',
    group: 'Admin',
    icon: Settings,
    desc: 'Platform configuration',
  },
  {
    id: '/audit-logs',
    label: 'Audit Logs',
    group: 'Admin',
    icon: FileText,
    desc: 'System audit trail',
  },
]

// ---------------------------------------------------------------------------
// Side A modules
// ---------------------------------------------------------------------------

export const ALL_SIDE_A_MODULES = [
  {
    id: 'side-a:dashboard',
    label: 'Master Overview Dashboard',
    group: 'Overview',
    desc: 'Server and electoral database statistics',
  },
  {
    id: 'side-a:lgas',
    label: 'Manage LGAs',
    group: 'Setup',
    desc: 'Local government registry',
  },
  {
    id: 'side-a:wards',
    label: 'Manage Wards',
    group: 'Setup',
    desc: 'Electoral ward registry',
  },
  {
    id: 'side-a:polling-units',
    label: 'Manage Polling Units',
    group: 'Setup',
    desc: 'Polling unit registry and mapping',
  },
  {
    id: 'side-a:parties',
    label: 'Manage Political Parties',
    group: 'Setup',
    desc: 'Political party records',
  },
  {
    id: 'side-a:users',
    label: 'User Hierarchy & Roster',
    group: 'Access',
    desc: 'Administrative staff directory',
  },
  {
    id: 'side-a:permissions',
    label: 'Role & Page Permissions Matrix',
    group: 'Access',
    desc: 'Unified permission controls',
  },
  {
    id: 'side-a:audit',
    label: 'Immutable Audit Logs',
    group: 'Security',
    desc: 'Security audit records',
  },
  {
    id: 'side-a:activity',
    label: 'User Activity Stream',
    group: 'Security',
    desc: 'User actions and telemetry',
  },
  {
    id: 'side-a:logins',
    label: 'Login History & Telemetry',
    group: 'Security',
    desc: 'Authentication history',
  },
  {
    id: 'side-a:exports',
    label: 'Data & Media Vault / Downloads',
    group: 'Maintenance',
    desc: 'Data exports and media',
  },
  {
    id: 'side-a:settings',
    label: 'Parameters & Database Vault',
    group: 'Maintenance',
    desc: 'Database and system parameters',
  },
]

export const SIDE_A_PATH = '/system-admin'

// ---------------------------------------------------------------------------
// Role presets and landing pages
// ---------------------------------------------------------------------------

const STATE_LEVEL_PAGES = [
  '/',
  '/map',
  '/incidents',
  '/agents',
  '/polling-units',
  ...ALL_DASHBOARD_PATHS,
  '/results',
  '/collation',
  '/election-results',
  '/communication',
  '/broadcast',
  '/notifications',
]

const candidatePages = (contestId) => {
  const contest = CONTESTS.find(
    (item) => item.id === contestId
  )

  if (!contest) return []

  return [
    dashboardPath(contest),
    '/',
    '/map',
    '/incidents',
    '/collation',
    '/election-results',
    '/notifications',
  ]
}

export const ROLE_PRESETS = {
  'Super Admin': [
    ...ALL_SIDE_B_PAGES.map((page) => page.id),
    ...ALL_SIDE_A_MODULES.map((module) => module.id),
  ],

  'Situation Room Officer': STATE_LEVEL_PAGES,

  'LGA Coordinator': [
    '/collation',
    '/polling-units',
    '/results',
    '/incidents',
    '/communication',
    '/broadcast',
    '/notifications',
  ],

  'Ward Coordinator': [
    '/polling-units',
    '/results',
    '/incidents',
    '/communication',
    '/notifications',
  ],

  'Polling Unit Agent': [
    '/results',
    '/incidents',
    '/notifications',
  ],

  'Director General': STATE_LEVEL_PAGES,
  'State Chairman': STATE_LEVEL_PAGES,
  'State Coordinator': STATE_LEVEL_PAGES,

  'Governorship Candidate': candidatePages('GOVERNORSHIP'),
  'Deputy Governorship Candidate': candidatePages('GOVERNORSHIP'),
  'Senatorial Candidate': candidatePages('SENATORIAL'),
  'House of Reps Candidate': candidatePages('HOUSE_OF_REPS'),
  'State Assembly Candidate': candidatePages('STATE_ASSEMBLY'),

  Observer: [
    '/election-results',
    '/notifications',
  ],
}

// ---------------------------------------------------------------------------
// Role normalization
// ---------------------------------------------------------------------------

const normalizeRole = (role) =>
  (role || '').trim().toLowerCase().replace(/_/g, ' ')

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

export function canonicalRole(user) {
  const norm = normalizeRole(user?.role)

  if (!norm) return ''

  const preset = Object.keys(ROLE_PRESETS).find(
    (role) => normalizeRole(role) === norm
  )

  return preset || ROLE_ALIASES[norm] || user.role
}

export function isSuperAdmin(user) {
  return canonicalRole(user) === 'Super Admin'
}

/** The contest assigned to a candidate role, or null. */
export function candidateContest(user) {
  const role = canonicalRole(user)

  if (!role.endsWith('Candidate')) return null

  const pages = ROLE_PRESETS[role] || []
  const path = pages.find((page) =>
    ALL_DASHBOARD_PATHS.includes(page)
  )

  return (
    CONTESTS.find(
      (contest) => dashboardPath(contest) === path
    ) || null
  )
}

// ---------------------------------------------------------------------------
// Granted permissions
// ---------------------------------------------------------------------------

export function parseAllowedPages(value) {
  if (!value) return []

  if (Array.isArray(value)) return value

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

export function grantedPages(user) {
  if (!user) return []

  if (isSuperAdmin(user)) {
    return ROLE_PRESETS['Super Admin']
  }

  const custom = parseAllowedPages(user.allowed_pages)

  if (custom.length > 0) return custom

  return ROLE_PRESETS[canonicalRole(user)] || []
}

export function canAccessSideA(user) {
  return (
    isSuperAdmin(user) ||
    grantedPages(user).some((page) =>
      page.startsWith('side-a')
    )
  )
}

export function canAccessPage(user, path) {
  if (!user) return false

  if (isSuperAdmin(user)) return true

  const clean = (path || '/')
    .split('?')[0]
    .split('#')[0]
    .replace(/\/+$/, '') || '/'

  if (
    clean === SIDE_A_PATH ||
    clean.startsWith(`${SIDE_A_PATH}/`)
  ) {
    return canAccessSideA(user)
  }

  return grantedPages(user).includes(clean)
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

const LANDING_PRIORITY = [
  ...ALL_DASHBOARD_PATHS,
  '/',
  '/collation',
  '/polling-units',
  '/results',
  '/incidents',
  '/election-results',
  '/map',
  '/agents',
  '/communication',
  '/broadcast',
  '/notifications',
  '/settings',
  '/audit-logs',
]

export function homePathFor(user) {
  if (!user) return '/login'

  if (isSuperAdmin(user)) return SIDE_A_PATH

  const contest = candidateContest(user)

  if (
    contest &&
    canAccessPage(user, dashboardPath(contest))
  ) {
    return dashboardPath(contest)
  }

  const granted = grantedPages(user)
  const landing = LANDING_PRIORITY.find(
    (path) => granted.includes(path)
  )

  if (landing) return landing

  if (canAccessSideA(user)) return SIDE_A_PATH

  return null
}

export function accessibleContests(user) {
  return CONTESTS.filter((contest) =>
    canAccessPage(user, dashboardPath(contest))
  )
}