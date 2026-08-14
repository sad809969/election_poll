import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import { 
  MessageSquare, 
  Users, 
  Radio, 
  Bell, 
  CheckCircle2, 
  Send, 
  Search, 
  Pin, 
  Phone, 
  ChevronRight,
  Shield
} from 'lucide-react'

export default function CommunicationCenterPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [selectedChannel, setSelectedChannel] = useState('All Agents (Broadcast)')
  const [searchQuery, setSearchQuery] = useState('')
  const [messageText, setMessageText] = useState('')
  const [liveMessages, setLiveMessages] = useState([])

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await apiFetch('/communication/messages');
        if (data && Array.isArray(data)) {
          setLiveMessages(data);
        }
      } catch (e) {
        console.error('Failed to load communication messages:', e);
      }
    }
    loadMessages();
  }, []);

  const channels = [
    { name: 'All Agents (Broadcast)', sub: '4,327 recipients targeted', count: '10:45 AM', active: true },
    { name: 'LGA Coordinators', sub: 'Please submit your LGA reports every 2 ho...', count: '10:30 AM', active: false },
    { name: 'Ward Coordinators', sub: 'Ensure your agents are reporting regularly.', count: '10:15 AM', active: false },
    { name: 'PU 025 - Guri Ward A', sub: 'Voting has started smoothly.', count: '10:05 AM', active: false },
    { name: 'State Situation Room Team', sub: 'Meeting at 2:00 PM today. Please be ready.', count: 'Yesterday', active: false },
    { name: 'Security Desk', sub: 'Security alert in Hadejia LGA. Details inside.', count: 'Yesterday', active: false },
  ]

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'
  const subcardClass = isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Communication Center" 
          subtitle="Send messages, announcements and alerts to agents and coordinators" 
        />

        <main className="p-6 space-y-6">
          {/* Top 5 Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Messages Sent</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>1,248</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Total messages sent</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><Send className="w-5 h-5" /></div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Recipients Reached</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>4,327</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Across all levels</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500"><Users className="w-5 h-5" /></div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Announcements</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>18</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Active announcements</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500"><Radio className="w-5 h-5" /></div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Alerts Sent</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>7</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Critical alerts sent</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Bell className="w-5 h-5" /></div>
            </div>

            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Delivery Rate</span>
                <h3 className={`text-2xl font-extrabold text-emerald-500 mt-1`}>98.6%</h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">Successfully delivered</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Chat Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List (1 Column) */}
            <div className={`${cardClass} rounded-xl p-4 flex flex-col h-[520px]`}>
              <div className="pb-3">
                <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Conversations</h3>
                <div className="relative mt-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {channels.map((ch, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedChannel(ch.name)}
                    className={`p-3 rounded-lg border transition cursor-pointer ${
                      selectedChannel === ch.name 
                        ? 'bg-pdp/20 border-pdp' 
                        : isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{ch.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{ch.count}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-1">{ch.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Chat Thread (1 Column) */}
            <div className={`${cardClass} rounded-xl p-5 flex flex-col justify-between h-[520px]`}>
              <div className={`flex justify-between items-center pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Radio className="w-4 h-4 text-pdp" /> {selectedChannel}
                  </h3>
                  <p className="text-xs text-slate-500">4,327 recipients targeted</p>
                </div>
                <button className="bg-pdp hover:bg-pdp-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Broadcast
                </button>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1">
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-pdp mb-1">
                    <Pin className="w-3.5 h-3.5" /> Pinned Announcement
                  </div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Election Day Guidelines</h4>
                  <p className="text-xs text-slate-500 mt-1">All agents must follow guidelines and report every activity from accreditation to results collation.</p>
                </div>

                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Good morning team,</p>
                  <p className="text-xs text-slate-500 mt-1">This is a reminder that accreditation must start by 8:30 AM. Please report immediately you arrive at your polling unit and keep us updated throughout the day.</p>
                  <span className="text-[10px] text-emerald-500 font-mono block mt-2">8:00 AM ✓✓</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Type your message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className={`flex-1 p-2.5 rounded-lg text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button className="bg-pdp hover:bg-pdp-dark text-white font-bold p-2.5 rounded-lg text-xs flex items-center gap-1">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Send Message Panel (1 Column) */}
            <div className={`${cardClass} rounded-xl p-5 flex flex-col justify-between h-[520px]`}>
              <div className="space-y-4">
                <h3 className={`text-xs font-bold border-b pb-2 ${isDark ? 'text-slate-200 border-slate-800' : 'text-slate-900 border-slate-100'}`}>New Message Composer</h3>

                <div className="space-y-1 text-xs">
                  <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Send message to</label>
                  <select className={`w-full border rounded-lg p-2 font-medium outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <option value="">Select Recipients</option>
                    <option value="agents">All Polling Unit Agents</option>
                    <option value="lga">LGA Coordinators</option>
                    <option value="ward">Ward Coordinators</option>
                  </select>
                </div>

                <div className="space-y-1 text-xs">
                  <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Message Type</label>
                  <select className={`w-full border rounded-lg p-2 font-medium outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <option value="announcement">Announcement</option>
                    <option value="alert">Emergency Alert</option>
                  </select>
                </div>

                <div className="space-y-1 text-xs">
                  <label className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Content</label>
                  <textarea rows={4} placeholder="Type your message here..." className={`w-full border rounded-lg p-2.5 font-medium outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}></textarea>
                </div>
              </div>

              <button className="w-full bg-pdp hover:bg-pdp-dark text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md">
                <Send className="w-4 h-4" /> Send Message
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
