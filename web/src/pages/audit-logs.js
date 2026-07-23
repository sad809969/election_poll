import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  FileText, 
  ShieldCheck, 
  Search, 
  Download, 
  Clock, 
  UserCheck, 
  MapPin,
  Laptop
} from 'lucide-react'

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const auditLogs = [
    { id: 'LOG-9821', user: 'Murtala A.', role: 'Polling Unit Agent', action: 'SUBMIT_EC8A_RESULT', details: 'Submitted official vote counts & EC8A result sheet photo for PU 023 Guri Ward A', ip: '197.210.28.45', lat: 27.02, lng: 12.34, time: '20 Apr 2027, 10:45 AM' },
    { id: 'LOG-9820', user: 'Aisha M.', role: 'Polling Unit Agent', action: 'REPORT_INCIDENT', details: 'Reported BVAS fingerprint malfunction resolved by technician at PU 078 Gumel Central', ip: '197.210.31.88', lat: 27.12, lng: 12.45, time: '20 Apr 2027, 10:42 AM' },
    { id: 'LOG-9819', user: 'Usman K.', role: 'Polling Unit Agent', action: 'FLAG_CRITICAL_INCIDENT', details: 'Flagged Critical Violence incident at PU 002 Jahun Ward A', ip: '197.210.12.19', lat: 27.05, lng: 12.15, time: '20 Apr 2027, 10:35 AM' },
    { id: 'LOG-9818', user: 'Abdullahi Usman', role: 'Super Admin', action: 'SUPER_ADMIN_LOGIN', details: 'Successful JWT authentication to Situation Room Command Center', ip: '102.89.23.11', lat: null, lng: null, time: '20 Apr 2027, 08:45 AM' },
    { id: 'LOG-9817', user: 'System', role: 'System Engine', action: 'SEED_JIGAWA_ELECTORAL_DATA', details: 'Initialized 27 LGAs, 287 Wards, and 4,827 Polling Units into database', ip: '127.0.0.1', lat: null, lng: null, time: '20 Apr 2027, 08:00 AM' },
  ]

  const filteredLogs = auditLogs.filter(log => 
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar theme="light" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Security Audit Logs" 
          subtitle="Immutable timestamped activity history, GPS metadata, and user action tracking" 
          theme="light"
        />

        <main className="p-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search audit log action, user, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
              />
            </div>

            <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition">
              <Download className="w-3.5 h-3.5" /> Export Audit Trail (CSV)
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900">Immutable Audit Trail</h3>
              <span className="text-xs font-mono text-slate-400">Showing {filteredLogs.length} Log Entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Log ID</th>
                    <th className="py-2.5 px-3">User & Role</th>
                    <th className="py-2.5 px-3">Action Event</th>
                    <th className="py-2.5 px-3">Action Details</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">GPS Tag</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-pdp">{log.id}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{log.user}</span>
                        <span className="text-[10px] text-slate-400">{log.role}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs">{log.details}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{log.ip}</td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                        {log.lat ? `${log.lat}, ${log.lng}` : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
