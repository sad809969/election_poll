import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  Send, 
  Users, 
  Megaphone, 
  AlertTriangle, 
  CheckCircle, 
  Paperclip, 
  Image as ImageIcon, 
  Pin, 
  Search,
  MessageSquare,
  ChevronRight,
  Sparkles
} from 'lucide-react'

export default function CommunicationCenter() {
  const [activeThread, setActiveThread] = useState('All Agents (Broadcast)')
  const [messageText, setMessageText] = useState('')

  const threads = [
    { title: 'All Agents (Broadcast)', time: '10:45 AM', badge: '1', desc: 'Important update: Accreditation must start by...', active: true },
    { title: 'LGA Coordinators', time: '10:30 AM', badge: '2', desc: 'Please submit your LGA reports every 2 hours.' },
    { title: 'Ward Coordinators', time: '10:15 AM', badge: '1', desc: 'Ensure your agents are reporting regularly.' },
    { title: 'PU 025 - Guri Ward A', time: '10:05 AM', desc: 'Voting has started smoothly.' },
    { title: 'State Situation Room Team', time: 'Yesterday', desc: 'Meeting at 2:00 PM today. Please be ready.' },
    { title: 'Security Desk', time: 'Yesterday', badge: '3', desc: 'Security alert in Hadejia LGA. Details inside.' },
    { title: 'Media Team', time: 'Apr 19', desc: 'Send verified photos and videos.' },
    { title: 'Transport Coordinators', time: 'Apr 19', desc: 'Update on movement and fuel availability.' },
  ]

  const templates = [
    { name: 'Accreditation Reminder', desc: 'Remind agents about accreditation...' },
    { name: 'Voting In Progress', desc: 'Voting has started in most polling units...' },
    { name: 'Stay Vigilant', desc: 'Security alert and vigilance reminder...' },
    { name: 'Results Collection', desc: 'Instructions for result collection...' },
  ]

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar theme="light" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Communication Center" 
          subtitle="Send messages, announcements and alerts to agents and coordinators" 
          theme="light" 
        />

        <main className="p-6 space-y-6">
          {/* Top 5 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Messages Sent</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-pdp"><Send className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-slate-900">1,248</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Total messages sent</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Recipients Reached</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Users className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-slate-900">4,327</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Across all levels</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Announcements</span>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Megaphone className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-slate-900">18</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Active announcements</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Alerts Sent</span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><AlertTriangle className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-slate-900">7</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Critical alerts sent</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Delivery Rate</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-slate-900">98.6%</h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Successfully delivered</p>
              </div>
            </div>
          </div>

          {/* Communication Layout (3 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[650px]">
            {/* Conversations Sidebar (1 Column) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full">
              <div className="p-3 border-b border-slate-100 space-y-2">
                <h3 className="text-xs font-bold text-slate-900">Conversations</h3>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input type="text" placeholder="Search conversations..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {threads.map((t, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setActiveThread(t.title)}
                    className={`p-3 cursor-pointer transition ${
                      activeThread === t.title ? 'bg-emerald-50/80 border-l-4 border-pdp' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-900 truncate">{t.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{t.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Chat Thread (2 Columns) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full">
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pdp text-white flex items-center justify-center font-bold text-xs">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{activeThread}</h3>
                    <p className="text-[10px] text-slate-400">4,327 recipients targeted</p>
                  </div>
                </div>
                <button className="bg-pdp hover:bg-pdp-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Broadcast
                </button>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {/* Pinned Announcement */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-pdp" /> Pinned Announcement
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono">Pinned on Apr 15, 2027</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Election Day Guidelines</h4>
                  <p className="text-[11px] text-slate-600">All agents must follow guidelines and report every activity from accreditation to results collation.</p>
                  <button className="text-[10px] font-bold text-pdp hover:underline pt-1">View Guidelines</button>
                </div>

                {/* Broadcast message sent */}
                <div className="flex flex-col items-end space-y-1">
                  <div className="bg-emerald-100 text-emerald-950 p-3 rounded-2xl rounded-tr-none max-w-lg text-xs shadow-sm space-y-1 border border-emerald-200">
                    <p className="font-semibold">Good morning team,</p>
                    <p>This is a reminder that accreditation must start by 8:30 AM. Please report immediately you arrive at your polling unit and keep us updated throughout the day.</p>
                    <p className="font-semibold">Stay vigilant and stay safe.</p>
                    <span className="text-[9px] text-emerald-700 font-mono block text-right">8:00 AM ✓✓</span>
                  </div>
                </div>

                {/* Field agent incoming response */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-300 font-bold text-xs flex items-center justify-center text-slate-700">AM</div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 max-w-sm text-xs shadow-sm">
                    <p className="font-bold text-slate-900 text-[11px]">PU 078 - Gumel Central</p>
                    <p className="text-[10px] text-slate-400 font-medium">Aisha Muhammad (Agent)</p>
                    <p className="mt-1 text-slate-700">Accreditation has started at 8:15 AM.</p>
                    <span className="text-[9px] text-slate-400 font-mono block text-right mt-1">8:16 AM</span>
                  </div>
                </div>
              </div>

              {/* Message Composer */}
              <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><Paperclip className="w-4 h-4" /></button>
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><ImageIcon className="w-4 h-4" /></button>
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                />
                <button className="bg-pdp hover:bg-pdp-dark text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition">
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            </div>

            {/* Right Panel (1 Column - New Message & Templates) */}
            <div className="space-y-6">
              {/* New Message Composer Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">New Message</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Send message to</label>
                    <select className="w-full mt-1 border border-slate-200 rounded-lg p-1.5 bg-slate-50 font-medium">
                      <option>Select Recipients</option>
                      <option>All Agents (Broadcast)</option>
                      <option>LGA Coordinators</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Message Type</label>
                    <select className="w-full mt-1 border border-slate-200 rounded-lg p-1.5 bg-slate-50 font-medium">
                      <option>Announcement</option>
                      <option>Emergency Alert</option>
                    </select>
                  </div>
                  <div>
                    <textarea placeholder="Type your message here..." className="w-full mt-1 border border-slate-200 rounded-lg p-2 bg-slate-50 h-20 text-xs outline-none"></textarea>
                  </div>
                  <button className="w-full bg-pdp hover:bg-pdp-dark text-white font-bold py-2 rounded-lg text-xs flex justify-center items-center gap-1.5 transition">
                    <Send className="w-3.5 h-3.5" /> Send Message
                  </button>
                </div>
              </div>

              {/* Message Templates */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900">Message Templates</h3>
                  <button className="text-[10px] font-bold text-pdp hover:underline">View All</button>
                </div>
                <div className="space-y-2">
                  {templates.map((tpl, idx) => (
                    <div key={idx} className="p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition cursor-pointer flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{tpl.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{tpl.desc}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
