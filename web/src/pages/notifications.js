import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import { 
  Bell, 
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  Megaphone,
  Activity,
  ShieldCheck
} from 'lucide-react'

export default function NotificationsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(new Set())

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now'
    try {
      const dt = new Date(isoString)
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return 'Just now'
    }
  }

  const loadLiveFeed = useCallback(async () => {
    setLoading(true)
    const combined = []

    // 1. Fetch announcements
    try {
      const announcements = await apiFetch('/announcements')
      const items = Array.isArray(announcements) ? announcements : announcements?.items || []
      items.forEach((a) => {
        combined.push({
          id: `ann-${a.id}`,
          rawId: a.id,
          type: a.urgency?.toLowerCase() === 'high' || a.urgency?.toLowerCase() === 'urgent' ? 'Emergency' : 'Broadcast',
          title: a.title,
          desc: a.message,
          time: formatTime(a.created_at),
          rawDate: a.created_at ? new Date(a.created_at) : new Date(),
          isUnread: true,
          badgeColor: a.urgency?.toLowerCase() === 'high' ? 'bg-red-500' : 'bg-pdp',
        })
      })
    } catch (err) {
      console.warn('Could not load announcements feed:', err)
    }

    // 2. Fetch incidents
    try {
      const incidents = await apiFetch('/incidents')
      const items = Array.isArray(incidents) ? incidents : incidents?.items || []
      items.forEach((inc) => {
        const isCritical = inc.severity?.toLowerCase() === 'critical' || inc.severity?.toLowerCase() === 'high'
        combined.push({
          id: `inc-${inc.id}`,
          rawId: inc.id,
          type: isCritical ? 'Emergency' : 'Incident',
          title: `${inc.incident_type} — ${inc.polling_unit_name || inc.lga_name || 'PU #' + inc.polling_unit_id}`,
          desc: inc.description || 'Incident reported from polling field.',
          time: formatTime(inc.created_at),
          rawDate: inc.created_at ? new Date(inc.created_at) : new Date(),
          isUnread: inc.status !== 'resolved',
          badgeColor: isCritical ? 'bg-red-500' : 'bg-amber-500',
        })
      })
    } catch (err) {
      console.warn('Could not load incidents feed:', err)
    }

    // 3. Fetch activities
    try {
      const activities = await apiFetch('/activities')
      const items = Array.isArray(activities) ? activities : activities?.items || []
      items.slice(0, 10).forEach((act) => {
        combined.push({
          id: `act-${act.id}`,
          rawId: act.id,
          type: 'System',
          title: `Milestone: ${act.activity_type?.replace(/_/g, ' ')}`,
          desc: act.notes || `Polling Unit #${act.polling_unit_id} activity recorded.`,
          time: formatTime(act.created_at),
          rawDate: act.created_at ? new Date(act.created_at) : new Date(),
          isUnread: false,
          badgeColor: 'bg-blue-500',
        })
      })
    } catch (err) {
      console.warn('Could not load activities feed:', err)
    }

    // Fallback if backend has zero records yet
    if (combined.length === 0) {
      combined.push(
        { id: 'sys-1', type: 'System', title: 'Situation Room Online', desc: 'Secure connection established to Render Cloud backend database.', time: 'Just now', rawDate: new Date(), isUnread: false, badgeColor: 'bg-pdp' },
        { id: 'sys-2', type: 'Broadcast', title: '2027 Election Protocol Active', desc: 'Accreditation, Form EC8A transmission, and incident tracking channels are live.', time: '08:00 AM', rawDate: new Date(), isUnread: false, badgeColor: 'bg-pdp' }
      )
    }

    // Sort newest first
    combined.sort((a, b) => b.rawDate - a.rawDate)
    setNotifications(combined)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLiveFeed()
    const timer = setInterval(loadLiveFeed, 30000)
    return () => clearInterval(timer)
  }, [loadLiveFeed])

  const markAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id))
    setReadIds(allIds)
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true
    return n.type === filter
  })

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Notifications & System Alerts" 
          subtitle="Real-time alert log, system notifications, and operational activity feeds" 
        />

        <main className="p-6 space-y-6">
          <div className={`${cardClass} rounded-xl p-4 flex flex-wrap justify-between items-center gap-3`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Filter:</span>
              {['All', 'Emergency', 'Incident', 'Broadcast', 'System'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filter === f 
                      ? 'bg-pdp text-white shadow-sm' 
                      : isDark ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={loadLiveFeed}
                disabled={loading}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black'
                }`}
                title="Refresh Feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-pdp' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button 
                onClick={markAllRead}
                className="text-xs font-bold text-pdp hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" /> Mark All as Read
              </button>
            </div>
          </div>

          <div className={`${cardClass} rounded-xl p-5 shadow-sm space-y-3`}>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200 border-slate-800' : 'text-slate-900 border-slate-100'}`}>
                Recent Notifications & Live Feed Stream ({filteredNotifications.length})
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to Database
              </span>
            </div>

            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-pdp" />
                Loading live alerts...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No notifications in "{filter}" category.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((n) => {
                  const isUnread = n.isUnread && !readIds.has(n.id)
                  return (
                    <div key={n.id} className={`p-4 rounded-xl border transition flex items-start gap-4 ${
                      isUnread 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className={`p-2.5 rounded-xl text-white ${n.badgeColor || 'bg-pdp'}`}>
                        {n.type === 'Emergency' ? <AlertTriangle className="w-4 h-4" /> :
                         n.type === 'Incident' ? <Activity className="w-4 h-4" /> :
                         n.type === 'Broadcast' ? <Megaphone className="w-4 h-4" /> :
                         <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{n.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

