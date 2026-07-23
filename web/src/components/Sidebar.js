import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  LayoutDashboard, 
  Activity, 
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
  Send,
  PlusCircle,
  Download,
  Radio
} from 'lucide-react'
import { useTheme } from '../pages/_app'

export default function Sidebar() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const isActive = (path) => router.pathname === path

  const navItemClass = (path) => `
    flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150
    ${isActive(path) 
      ? 'bg-pdp text-white shadow-md shadow-pdp/20 font-bold' 
      : isDark 
        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60' 
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }
  `

  const sectionLabelClass = isDark 
    ? 'px-3.5 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mt-5 mb-2' 
    : 'px-3.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mt-5 mb-2'

  return (
    <aside className={`w-64 flex-shrink-0 flex flex-col border-r h-screen sticky top-0 transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Brand Header */}
      <div className={`p-4 border-b flex items-center gap-3 ${isDark ? 'border-slate-800/40' : 'border-slate-200'}`}>
        <div className="w-10 h-10 rounded-full bg-pdp/20 border-2 border-pdp flex items-center justify-center text-pdp font-bold shadow-inner">
          <svg className="w-6 h-6 fill-current text-pdp" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 3.88 2.21 7.24 5.46 8.93L12 13V2zm0 0c5.52 0 10 4.48 10 10 0 3.88-2.21 7.24-5.46 8.93L12 13V2z"/>
          </svg>
        </div>
        <div>
          <h1 className="font-black text-sm tracking-tight leading-tight flex items-center gap-1">
            <span className="text-red-500">JIGAWA</span> <span className={isDark ? 'text-white' : 'text-slate-900'}>PDP</span>
          </h1>
          <p className="text-pdp font-extrabold text-xs tracking-wider">PollWatch</p>
          <p className={`text-[9px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Election Situation Room 2027</p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <div className={sectionLabelClass}>MAIN</div>
        <Link href="/" className={navItemClass('/')}>
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
        <Link href="/map" className={navItemClass('/map')}>
          <Map className="w-4 h-4" />
          <span>Interactive Map</span>
        </Link>
        <Link href="/incidents" className={navItemClass('/incidents')}>
          <AlertTriangle className="w-4 h-4" />
          <span>Incident Tracker</span>
        </Link>
        <Link href="/agents" className={navItemClass('/agents')}>
          <Users className="w-4 h-4" />
          <span>Agents</span>
        </Link>
        <Link href="/polling-units" className={navItemClass('/polling-units')}>
          <Building2 className="w-4 h-4" />
          <span>Polling Units</span>
        </Link>

        <div className={sectionLabelClass}>RESULTS</div>
        <Link href="/results" className={navItemClass('/results')}>
          <BarChart3 className="w-4 h-4" />
          <span>Results Dashboard</span>
        </Link>
        <Link href="/collation" className={navItemClass('/collation')}>
          <PieChart className="w-4 h-4" />
          <span>Collation Center</span>
        </Link>

        <div className={sectionLabelClass}>COMMUNICATION</div>
        <Link href="/communication" className={navItemClass('/communication')}>
          <MessageSquare className="w-4 h-4" />
          <span>Communication Center</span>
        </Link>
        <Link href="/broadcast" className={navItemClass('/broadcast')}>
          <Radio className="w-4 h-4" />
          <span>Broadcast Messages</span>
        </Link>
        <Link href="/notifications" className={navItemClass('/notifications')}>
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </Link>

        <div className={sectionLabelClass}>ADMIN & MANAGEMENT</div>
        <Link href="/admin" className={navItemClass('/admin')}>
          <UserCheck className="w-4 h-4" />
          <span>User Management</span>
        </Link>
        <Link href="/settings" className={navItemClass('/settings')}>
          <Settings className="w-4 h-4" />
          <span>System Settings</span>
        </Link>
        <Link href="/audit-logs" className={navItemClass('/audit-logs')}>
          <FileText className="w-4 h-4" />
          <span>Audit Logs</span>
        </Link>

        {/* Quick Actions Panel */}
        <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-800/40' : 'border-slate-200'}`}>
          <div className={`rounded-xl p-3 space-y-2 border ${
            isDark ? 'bg-pdp/10 border-pdp/20' : 'bg-emerald-50/60 border-emerald-200'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-pdp">
              <Activity className="w-4 h-4" />
              <span>Quick Actions</span>
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pdp hover:bg-pdp-dark text-white text-[11px] font-semibold transition">
              <Send className="w-3.5 h-3.5" />
              <span>Send Broadcast</span>
            </button>
            <button className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition border ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Announcement</span>
            </button>
            <button className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition border ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              <Download className="w-3.5 h-3.5" />
              <span>Export Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Version */}
      <div className={`p-3 border-t text-[10px] text-center flex justify-between items-center ${
        isDark ? 'border-slate-800/40 text-slate-500' : 'border-slate-200 text-slate-400'
      }`}>
        <span>© 2027 Jigawa PDP</span>
        <span className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>v1.0.0</span>
      </div>
    </aside>
  )
}
