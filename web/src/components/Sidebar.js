import { useState, useEffect } from 'react'
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
  Radio,
  FileSpreadsheet,
  Lock,
  LogOut,
  X
} from 'lucide-react'
import { useTheme } from '../pages/_app'
import { getCurrentUser, logoutUser } from '../lib/api'
import {
  accessibleContests,
  canAccessPage,
  canAccessSideA as userCanAccessSideA,
  canonicalRole,
  dashboardPath,
  isSuperAdmin as userIsSuperAdmin,
} from '../lib/access'

export default function Sidebar() {
  const router = useRouter()
  const { theme, mobileOpen, closeMobile } = useTheme()
  const isDark = theme === 'dark'
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [router.asPath])

  const isSuperAdmin = userIsSuperAdmin(currentUser)
  const canAccess = (path) => canAccessPage(currentUser, path)
  const canAccessSideA = userCanAccessSideA(currentUser)

  const handleSignOut = () => {
    logoutUser()
    closeMobile()
    router.replace('/login')
  }

  const isActive = (path) => router.asPath.split('?')[0] === path

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

  // Navigation Items Grouping
  const mainItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Interactive Map', path: '/map', icon: Map },
    { label: 'Incident Tracker', path: '/incidents', icon: AlertTriangle },
    { label: 'Agents', path: '/agents', icon: Users },
    { label: 'Polling Units', path: '/polling-units', icon: Building2 },
  ].filter(item => canAccess(item.path))

  const dashboardItems = accessibleContests(currentUser).map(c => ({
    label: c.title.replace(' Dashboard', ''),
    path: dashboardPath(c),
    icon: c.icon,
  }))

  const resultsItems = [
    { label: 'Results Dashboard', path: '/results', icon: BarChart3 },
    { label: 'Collation Center', path: '/collation', icon: PieChart },
    { label: 'Results by Office & Export', path: '/election-results', icon: FileSpreadsheet, iconClass: 'text-emerald-400' },
  ].filter(item => canAccess(item.path))

  const commsItems = [
    { label: 'Communication Center', path: '/communication', icon: MessageSquare },
    { label: 'Broadcast Messages', path: '/broadcast', icon: Radio },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ].filter(item => canAccess(item.path))

  const adminItems = [
    { label: 'User Management', path: '/admin', icon: UserCheck },
    { label: 'System Settings', path: '/settings', icon: Settings },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileText },
  ].filter(item => canAccess(item.path))

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div 
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-20 w-64 flex-shrink-0 flex flex-col border-r h-screen transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isDark ? 'bg-[#070D1E] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}
      `}>
        {/* Brand Header with Official PDP Logo */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800/40' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900/40 p-1 flex items-center justify-center border border-pdp/30 shadow-sm flex-shrink-0">
              <img src="/pdp_logo.png" alt="Peoples Democratic Party Logo" className="w-8 h-8 object-contain drop-shadow" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight leading-tight flex items-center gap-1">
                <span className="text-red-500">JIGAWA</span> <span className={isDark ? 'text-white' : 'text-slate-900'}>PDP</span>
              </h1>
              <p className="text-pdp font-extrabold text-xs tracking-wider">PollWatch</p>
              <p className={`text-[9px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Situation Room 2027</p>
            </div>
          </div>

          {/* Close Button for Mobile Drawer */}
          <button 
            onClick={closeMobile}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {/* MAIN SECTION */}
          {mainItems.length > 0 && (
            <>
              <div className={sectionLabelClass}>MAIN</div>
              {mainItems.map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.path} href={item.path} onClick={closeMobile} className={navItemClass(item.path)}>
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}

          {/* ELECTION DASHBOARDS SECTION */}
          {dashboardItems.length > 0 && (
            <>
              <div className={sectionLabelClass}>ELECTION DASHBOARDS</div>
              {dashboardItems.map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.path} href={item.path} onClick={closeMobile} className={navItemClass(item.path)}>
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}

          {/* RESULTS SECTION */}
          {resultsItems.length > 0 && (
            <>
              <div className={sectionLabelClass}>RESULTS</div>
              {resultsItems.map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.path} href={item.path} onClick={closeMobile} className={navItemClass(item.path)}>
                    <Icon className={`w-4 h-4 ${item.iconClass || ''}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}

          {/* COMMUNICATION SECTION */}
          {commsItems.length > 0 && (
            <>
              <div className={sectionLabelClass}>COMMUNICATION</div>
              {commsItems.map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.path} href={item.path} onClick={closeMobile} className={navItemClass(item.path)}>
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}

          {/* ADMIN & MANAGEMENT SECTION */}
          {adminItems.length > 0 && (
            <>
              <div className={sectionLabelClass}>ADMIN & MANAGEMENT</div>
              {adminItems.map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.path} href={item.path} onClick={closeMobile} className={navItemClass(item.path)}>
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}

          {/* Quick Actions Panel */}
          {(isSuperAdmin || canAccess('/broadcast') || canAccess('/communication') || canAccess('/results')) && (
            <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-800/40' : 'border-slate-200'}`}>
              <div className={`rounded-xl p-3 space-y-2 border ${
                isDark ? 'bg-pdp/10 border-pdp/20' : 'bg-emerald-50/60 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-pdp">
                  <Activity className="w-4 h-4" />
                  <span>Quick Actions</span>
                </div>
                {canAccess('/broadcast') && (
                  <button 
                    onClick={() => { closeMobile(); router.push('/broadcast'); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pdp hover:bg-pdp-dark text-white text-[11px] font-semibold transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Broadcast</span>
                  </button>
                )}
                {canAccess('/communication') && (
                  <button 
                    onClick={() => { closeMobile(); router.push('/communication'); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition border ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Announcement</span>
                  </button>
                )}
                {canAccess('/results') && (
                  <button 
                    onClick={() => { closeMobile(); router.push('/results'); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition border ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Reports</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Signed-in user */}
        {currentUser && (
          <div className={`px-3 pt-3 border-t ${isDark ? 'border-slate-800/40' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {currentUser.full_name || currentUser.username}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{canonicalRole(currentUser)}</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/60' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer System Version & Discreet Master Admin Link */}
        <div className={`p-3 border-t text-[10px] text-center flex justify-between items-center ${
          isDark ? 'border-slate-800/40 text-slate-500' : 'border-slate-200 text-slate-400'
        }`}>
          <span>© 2027 Jigawa PDP</span>
          {canAccessSideA && (
            <Link
              href="/system-admin"
              title="Side A Master Control Panel (Operator / Admin)"
              className="flex items-center gap-1 font-mono text-emerald-400 hover:text-emerald-300 transition"
            >
              <Lock className="w-3 h-3" />
              <span>Side A</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
