import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { 
  Shield, 
  Database, 
  Cloud, 
  Bell, 
  Save, 
  CheckCircle2, 
  RefreshCw
} from 'lucide-react'

export default function SystemSettingsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState('Security & JWT')
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const cardClass = isDark ? 'bg-[#141E38] border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'
  const inputClass = isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="System Settings & Security Configuration" 
          subtitle="Configure JWT parameters, database backups, cloud media storage and FCM credentials" 
        />

        <main className="p-6 space-y-6">
          {/* Tabs */}
          <div className={`flex items-center gap-2 pb-2 text-xs font-bold border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            {['Security & JWT', 'Cloud Storage (S3)', 'FCM Push Notifications', 'Database & Backup'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === tab ? 'bg-pdp text-white shadow-sm' : isDark ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Saved Banner */}
          {isSaved && (
            <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-pdp" /> Configuration settings updated successfully!
            </div>
          )}

          {/* Form Card */}
          <div className={`${cardClass} rounded-xl p-6 shadow-sm space-y-6 max-w-3xl`}>
            {activeTab === 'Security & JWT' && (
              <div className="space-y-4 text-xs">
                <h3 className={`text-sm font-bold flex items-center gap-2 pb-2 border-b ${isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'}`}>
                  <Shield className="w-4 h-4 text-pdp" /> JWT Authentication Parameters
                </h3>
                
                <div className="space-y-1">
                  <label className={`font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>JWT Secret Key</label>
                  <input type="password" value="jigawa-pdp-pollwatch-2027-super-secret-key-987654321" readOnly className={`w-full border rounded-lg p-2.5 font-mono ${inputClass}`} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={`font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Token Expiration (Minutes)</label>
                    <input type="number" defaultValue={10080} className={`w-full border rounded-lg p-2.5 font-medium ${inputClass}`} />
                  </div>
                  <div className="space-y-1">
                    <label className={`font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Encryption Algorithm</label>
                    <input type="text" value="HS256" readOnly className={`w-full border rounded-lg p-2.5 font-mono ${inputClass}`} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Cloud Storage (S3)' && (
              <div className="space-y-4 text-xs">
                <h3 className={`text-sm font-bold flex items-center gap-2 pb-2 border-b ${isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'}`}>
                  <Cloud className="w-4 h-4 text-pdp" /> AWS S3 / Cloudinary Media Storage
                </h3>
                
                <div className="space-y-1">
                  <label className={`font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>S3 Bucket Name</label>
                  <input type="text" defaultValue="jigawa-pdp-ec8a-photos" className={`w-full border rounded-lg p-2.5 font-medium ${inputClass}`} />
                </div>
              </div>
            )}

            {activeTab === 'FCM Push Notifications' && (
              <div className="space-y-4 text-xs">
                <h3 className={`text-sm font-bold flex items-center gap-2 pb-2 border-b ${isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'}`}>
                  <Bell className="w-4 h-4 text-pdp" /> Firebase Cloud Messaging (FCM)
                </h3>
                
                <div className="space-y-1">
                  <label className={`font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>FCM Server API Key</label>
                  <input type="password" value="AAAA_fcm_server_key_jigawa_pdp_2027" readOnly className={`w-full border rounded-lg p-2.5 font-mono ${inputClass}`} />
                </div>
              </div>
            )}

            {activeTab === 'Database & Backup' && (
              <div className="space-y-4 text-xs">
                <h3 className={`text-sm font-bold flex items-center gap-2 pb-2 border-b ${isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'}`}>
                  <Database className="w-4 h-4 text-pdp" /> Database Configuration & Automated Backup
                </h3>
                
                <div className="space-y-1">
                  <label className={`font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Current Database Engine</label>
                  <input type="text" value="SQLite 3.x (Local Engine) / PostgreSQL Async" readOnly className={`w-full border rounded-lg p-2.5 font-mono ${inputClass}`} />
                </div>

                <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition">
                  <RefreshCw className="w-3.5 h-3.5" /> Trigger Instant Database Backup
                </button>
              </div>
            )}

            <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button 
                onClick={handleSave}
                className="bg-pdp hover:bg-pdp-dark text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
