import { Search, Bell, Mail, Sun, Moon, Shield } from 'lucide-react'

export default function Header({ 
  title = "Dashboard", 
  subtitle = "Overview of election activities across Jigawa State",
  theme = "dark",
  onToggleTheme
}) {
  const isDark = theme === 'dark'

  return (
    <header className={`h-16 border-b px-6 flex items-center justify-between sticky top-0 z-30 ${
      isDark ? 'bg-[#0B132B] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Title & Breadcrumb */}
      <div>
        <h1 className="text-base font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
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

        {/* Theme Toggle */}
        <button 
          onClick={onToggleTheme}
          className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
            isDark 
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black'
          }`}
        >
          {isDark ? <Moon className="w-3.5 h-3.5 text-pdp" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
          <span className="capitalize">{theme}</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-800/50 transition text-slate-400 hover:text-slate-100">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">12</span>
        </button>

        {/* Messages */}
        <button className="relative p-2 rounded-lg hover:bg-slate-800/50 transition text-slate-400 hover:text-slate-100">
          <Mail className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">5</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pdp to-emerald-400 p-0.5 shadow">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
              AU
            </div>
          </div>
          <div className="hidden lg:block leading-tight">
            <p className="text-xs font-bold">Abdullahi Usman</p>
            <p className="text-[10px] text-pdp font-semibold flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              <span>Situation Room Director</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
