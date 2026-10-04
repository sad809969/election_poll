import { Search, Bell, Mail, Sun, Moon, Shield, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from '../pages/_app'
import { getCurrentUser } from '../lib/api'
import { canonicalRole } from '../lib/access'

export default function Header({
  title = 'Dashboard',
  subtitle = 'Overview of election activities across Jigawa State'
}) {
  const { theme, toggleTheme, toggleMobile } = useTheme()
  const router = useRouter()
  const isDark = theme === 'dark'

  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadUser = () => {
      setUser(getCurrentUser())
    }

    loadUser()

    window.addEventListener('focus', loadUser)
    window.addEventListener('storage', loadUser)

    return () => {
      window.removeEventListener('focus', loadUser)
      window.removeEventListener('storage', loadUser)
    }
  }, [])

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    'User'

  const roleName = user ? canonicalRole(user) : 'Loading...'

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'U'

  const controlClass = `p-2 rounded-lg transition ${
    isDark
      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
  }`

  return (
    <header
      className={`h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 ${
        isDark
          ? 'bg-[#0B132B] border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Title, logo and mobile menu */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleMobile}
          className={`lg:hidden p-2 rounded-lg border transition ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-200'
              : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}
          title="Open Menu"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <img
          src="/pdp_logo.png"
          alt="PDP Logo"
          className="w-8 h-8 object-contain drop-shadow"
        />

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
            {title}
          </h1>

          {subtitle && (
            <p
              className={`text-[11px] sm:text-xs font-medium hidden sm:block truncate ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="relative w-48 xl:w-64 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />

          <input
            type="text"
            placeholder="Search anything..."
            aria-label="Search"
            className={`w-full pl-9 pr-4 py-1.5 rounded-lg text-xs outline-none transition border ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-pdp'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-pdp'
            }`}
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Dark / Light Theme"
          aria-label="Toggle Dark / Light Theme"
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white hover:border-pdp'
              : 'bg-slate-100 border-slate-300 text-slate-800 hover:text-black hover:border-pdp'
          }`}
        >
          {isDark ? (
            <>
              <Moon className="w-4 h-4 text-pdp fill-pdp" />
              <span className="hidden sm:inline">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="hidden sm:inline">Light</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => router.push('/notifications')}
          className={`${controlClass} relative`}
          aria-label="Notifications"
          title="View Notifications & Live Alerts"
          type="button"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-400/40 animate-pulse" />
        </button>

        {/* Messages */}
        <button
          onClick={() => router.push('/communication')}
          className={`${controlClass} hidden sm:block`}
          aria-label="Messages"
          title="Open Communication Centre"
          type="button"
        >
          <Mail className="w-4 h-4" />
        </button>

        {/* Signed-in user profile */}
        <div
          className={`flex items-center gap-2.5 pl-2 border-l ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pdp to-emerald-400 p-0.5 shadow flex-shrink-0">
            <div
              className={`w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-white ${
                isDark ? 'bg-slate-900' : 'bg-pdp-dark'
              }`}
            >
              {initials}
            </div>
          </div>

          <div className="hidden xl:block leading-tight">
            <p className="text-xs font-bold">
              {displayName}
            </p>

            <p className="text-pdp font-semibold text-[10px] flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              <span>{roleName}</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}