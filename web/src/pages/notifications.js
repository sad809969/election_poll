import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Clock, 
  Search, 
  CheckCheck,
  Trash2
} from 'lucide-react'

export default function NotificationsPage() {
  const [filter, setFilter] = useState('All')

  const notifications = [
    { id: 1, type: 'Emergency', title: 'Critical Incident Reported', desc: 'Violence reported at PU 002 Jahun LGA. Situation room team dispatched.', time: '10:35 AM', isUnread: true },
    { id: 2, type: 'System', title: 'EC8A Photo Upload Verified', desc: 'Agent Murtala A. uploaded EC8A result sheet photo for PU 023 Guri LGA.', time: '10:40 AM', isUnread: true },
    { id: 3, type: 'Incident', title: 'BVAS Malfunction Resolved', desc: 'INEC technician resolved fingerprint scanner issue at PU 078 Gumel Central.', time: '10:42 AM', isUnread: false },
    { id: 4, type: 'System', title: 'Agent Bulk Import Completed', desc: '512 field agent accounts imported successfully via Excel CSV.', time: '09:15 AM', isUnread: false },
    { id: 5, type: 'Audit', title: 'Super Admin Security Login', desc: 'User Abdullahi Usman logged into Situation Room Command Center.', time: '08:45 AM', isUnread: false },
  ]

  const filteredNotifications = notifications.filter(n => filter === 'All' || n.type === filter)

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar theme="light" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Notifications & System Alerts" 
          subtitle="Real-time alert log, system notifications, and operational activity feeds" 
          theme="light"
        />

        <main className="p-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Notifications:</span>
              {['All', 'Emergency', 'System', 'Incident', 'Audit'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filter === f ? 'bg-pdp text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button className="text-xs font-bold text-pdp hover:underline flex items-center gap-1">
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">Recent Notifications Stream</h3>
            <div className="space-y-3">
              {filteredNotifications.map((n) => (
                <div key={n.id} className={`p-4 rounded-xl border transition flex items-start gap-4 ${
                  n.isUnread ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className={`p-2.5 rounded-xl text-white ${
                    n.type === 'Emergency' ? 'bg-red-500' : n.type === 'Incident' ? 'bg-amber-500' : 'bg-pdp'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
