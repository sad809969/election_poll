import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  Radio, 
  Send, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Paperclip, 
  Image as ImageIcon, 
  Pin,
  Megaphone,
  BellRing
} from 'lucide-react'

export default function BroadcastMessagesPage() {
  const [targetScope, setTargetScope] = useState('All Agents')
  const [urgency, setUrgency] = useState('Normal')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [isSent, setIsSent] = useState(false)

  const broadcastHistory = [
    { id: 1, title: 'Accreditation Start Reminder', target: 'All Field Agents', urgency: 'Emergency', time: '08:00 AM', recipients: 4327, delivery: '99.2%' },
    { id: 2, title: 'Voting Progress Check-in', target: 'LGA Coordinators', urgency: 'Normal', time: '10:30 AM', recipients: 27, delivery: '100%' },
    { id: 3, title: 'Security Vigilance Alert', target: 'Security Desk', urgency: 'Emergency', time: '11:15 AM', recipients: 12, delivery: '100%' },
    { id: 4, title: 'EC8A Result Upload Instructions', target: 'Polling Unit Agents', urgency: 'Normal', time: '01:45 PM', recipients: 3912, delivery: '98.4%' },
  ]

  const handleSendBroadcast = () => {
    if (!title || !message) return
    setIsSent(true)
    setTimeout(() => {
      setTitle('')
      setMessage('')
      setIsSent(false)
    }, 2500)
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar theme="light" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Broadcast Messages & Push Alerts" 
          subtitle="Send targeted emergency broadcasts and instant FCM push notifications to field agents" 
          theme="light"
        />

        <main className="p-6 space-y-6">
          {/* Main Grid: Composer + History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Broadcast Composer (2 Columns) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-pdp" /> Send Broadcast Announcement
                </h3>
                <span className="text-xs bg-emerald-50 text-pdp font-bold px-2.5 py-1 rounded-full border border-pdp/20">
                  FCM Push Gateway Active
                </span>
              </div>

              {isSent && (
                <div className="p-3 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-pdp" /> Broadcast successfully dispatched to 4,327 field agents!
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Recipient Scope</label>
                  <select 
                    value={targetScope}
                    onChange={(e) => setTargetScope(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-medium outline-none"
                  >
                    <option value="All Agents">All Agents (Statewide Broadcast)</option>
                    <option value="LGA Coordinators">LGA Coordinators (27 LGAs)</option>
                    <option value="Ward Coordinators">Ward Coordinators (287 Wards)</option>
                    <option value="Security Desk">Security Desk Officers</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Urgency Level</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                      onClick={() => setUrgency('Normal')}
                      className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${
                        urgency === 'Normal' ? 'bg-pdp text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Normal Notice
                    </button>
                    <button 
                      onClick={() => setUrgency('Emergency')}
                      className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${
                        urgency === 'Emergency' ? 'bg-red-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Emergency Alert
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <label className="font-bold text-slate-700 block">Broadcast Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Election Day Guidelines & Accreditation Notice..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium outline-none"
                />
              </div>

              <div className="text-xs space-y-1">
                <label className="font-bold text-slate-700 block">Message Content</label>
                <textarea 
                  placeholder="Type broadcast text here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 font-medium outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-400">
                  <button className="p-2 hover:bg-slate-100 rounded-lg"><Paperclip className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg"><ImageIcon className="w-4 h-4" /></button>
                  <span className="text-[10px]">Attach guidelines or photo</span>
                </div>

                <button 
                  onClick={handleSendBroadcast}
                  className="bg-pdp hover:bg-pdp-dark text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-md"
                >
                  <Send className="w-4 h-4" /> Dispatch Broadcast
                </button>
              </div>
            </div>

            {/* Broadcast History Table (1 Column) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">Recent Broadcast History</h3>
              <div className="space-y-3">
                {broadcastHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        item.urgency === 'Emergency' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.urgency}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Target: {item.target}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 font-mono">
                      <span>{item.recipients} recipients</span>
                      <span className="text-pdp font-bold">{item.delivery} delivered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
