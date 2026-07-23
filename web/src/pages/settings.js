import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  Settings as SettingsIcon, 
  Shield, 
  Database, 
  Cloud, 
  Bell, 
  Key, 
  Save, 
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react'

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('Security & JWT')
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar theme="light" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="System Settings & Security Configuration" 
          subtitle="Configure JWT parameters, database backups, cloud media storage and FCM credentials" 
          theme="light"
        />

        <main className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
            {['Security & JWT', 'Cloud Storage (S3)', 'FCM Push Notifications', 'Database & Backup'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === tab ? 'bg-pdp text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Saved Banner */}
          {isSaved && (
            <div className="p-3 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-pdp" /> Configuration settings updated successfully!
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 max-w-3xl">
            {activeTab === 'Security & JWT' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Shield className="w-4 h-4 text-pdp" /> JWT Authentication Parameters
                </h3>
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">JWT Secret Key</label>
                  <input type="password" value="jigawa-pdp-pollwatch-2027-super-secret-key-987654321" readOnly className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-slate-600 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Token Expiration (Minutes)</label>
                    <input type="number" defaultValue={10080} className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Encryption Algorithm</label>
                    <input type="text" value="HS256" readOnly className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-slate-600 outline-none" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Enforce Strict Role-Based Access (RBAC)</p>
                    <p className="text-[10px] text-slate-500">Require specific token scope for API endpoints</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-pdp" />
                </div>
              </div>
            )}

            {activeTab === 'Cloud Storage (S3)' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Cloud className="w-4 h-4 text-pdp" /> AWS S3 / Cloudinary Media Storage
                </h3>
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">S3 Bucket Name</label>
                  <input type="text" defaultValue="jigawa-pdp-ec8a-photos" className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">AWS Region</label>
                  <input type="text" defaultValue="eu-west-1 (Ireland)" className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium outline-none" />
                </div>
              </div>
            )}

            {activeTab === 'FCM Push Notifications' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Bell className="w-4 h-4 text-pdp" /> Firebase Cloud Messaging (FCM)
                </h3>
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">FCM Server API Key</label>
                  <input type="password" value="AAAA_fcm_server_key_jigawa_pdp_2027" readOnly className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono outline-none" />
                </div>
              </div>
            )}

            {activeTab === 'Database & Backup' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Database className="w-4 h-4 text-pdp" /> Database Configuration & Automated Backup
                </h3>
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Current Database Engine</label>
                  <input type="text" value="SQLite 3.x (Local Engine) / PostgreSQL Async" readOnly className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-slate-600 outline-none" />
                </div>

                <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition">
                  <RefreshCw className="w-3.5 h-3.5" /> Trigger Instant Database Backup
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
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
