import { Search, Bell, Mail, Sun, Moon, Shield } from 'lucide-react'
import { useTheme } from '../pages/_app'

export default function Header({ 
  title = "Dashboard", 
  subtitle = "Overview of election activities across Jigawa State"
}) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className={`h-16 border-b px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 ${
      isDark ? 'bg-[#0B132B] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Title & Breadcrumb with PDP Logo Badge */}
      <div className="flex items-center gap-3">
        <img src="/pdp_logo.png" alt="PDP Logo" className="w-8 h-8 object-contain drop-shadow" />
        <div>
          <h1 className="text-base font-bold tracking-tight">{title}</h1>
          {subtitle && <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative w-64 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className={`w-full pl-9 pr-4 py-1.5 rounded-lg text-xs outline-none transition border ${
              isDark 
                ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-pdp' 
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-pdp'
            }`}
          />
        </div>

        {/* Global Dark / Light Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          title="Toggle Dark / Light Theme"
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
            isDark 
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white hover:border-pdp' 
              : 'bg-slate-100 border-slate-300 text-slate-800 hover:text-black hover:border-pdp'
          }`}
        >
          {isDark ? (
            <>
              <Moon className="w-4 h-4 text-pdp fill-pdp" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Light</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <button className={`relative p-2 rounded-lg transition ${
          isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
        }`}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">12</span>
        </button>

        {/* Messages */}
        <button className={`relative p-2 rounded-lg transition ${
          isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
        }`}>
          <Mail className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">5</span>
        </button>

        {/* User Profile */}
        <div className={`flex items-center gap-3 pl-2 border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pdp to-emerald-400 p-0.5 shadow">
            <div className={`w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-white ${
              isDark ? 'bg-slate-900' : 'bg-pdp-dark'
            }`}>
              AU
            </div>
          </div>
          <div className="hidden lg:block leading-tight">
            <p className="text-xs font-bold">Abdullahi Usman</p>
            <p className="text-pdp font-semibold text-[10px] flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              <span>Situation Room Director</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
