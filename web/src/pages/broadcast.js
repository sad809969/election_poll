import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { apiFetch } from '../lib/api'
import {
  Radio,
  Send,
  CheckCircle2,
  Paperclip,
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle,
  Clock,
  Users,
  Bell,
  Shield,
} from 'lucide-react'

const recipientOptions = [
  { value: 'All Agents', label: 'All Agents (Statewide Broadcast)' },
  { value: 'LGA Coordinators', label: 'LGA Coordinators' },
  { value: 'Ward Coordinators', label: 'Ward Coordinators' },
  { value: 'Security Desk', label: 'Security Desk Officers' },
]

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString()
}

export default function BroadcastMessagesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [targetScope, setTargetScope] = useState('All Agents')
  const [urgency, setUrgency] = useState('Normal')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cardClass = isDark
    ? 'bg-[#141E38] border border-slate-800'
    : 'bg-white border border-slate-200 shadow-sm'

  const inputClass = `w-full rounded-lg border p-2.5 text-sm outline-none ${
    isDark
      ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
  }`

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiFetch('/announcements')

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data?.announcements)
          ? data.announcements
          : Array.isArray(data?.items)
            ? data.items
            : []

      setAnnouncements(records)
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
      setError('Unable to load broadcast history. Check your backend connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Please enter both a title and message.')
      setConfirmSend(false)
      return
    }

    setSending(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch('/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          urgency,
          target_role: targetScope,
          sender_name: 'Situation Room HQ',
        }),
      })

      setSuccess('Broadcast submitted successfully.')
      setTitle('')
      setMessage('')
      setConfirmSend(false)

      await loadAnnouncements()
    } catch (err) {
      console.error('Error dispatching broadcast:', err)
      setError(
        'Broadcast could not be sent. Please check the backend and try again.'
      )
      setConfirmSend(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#070D1E] text-slate-100'
          : 'bg-slate-50 text-slate-800'
      }`}
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Header
          title="Broadcast Centre"
          subtitle="Send announcements and operational alerts to selected recipients"
        />

        <main className="space-y-6 p-4 md:p-6">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className={`${cardClass} flex items-center justify-between rounded-xl p-4`}>
              <div>
                <p className="text-xs font-bold text-slate-400">
                  Total Broadcasts
                </p>
                <h3 className="mt-1 text-2xl font-extrabold">
                  {announcements.length}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Loaded from the server
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
                <Radio className="h-5 w-5" />
              </div>
            </div>

            <div className={`${cardClass} flex items-center justify-between rounded-xl p-4`}>
              <div>
                <p className="text-xs font-bold text-slate-400">
                  Emergency Broadcasts
                </p>
                <h3 className="mt-1 text-2xl font-extrabold">
                  {
                    announcements.filter(
                      (item) =>
                        String(item.urgency || '').toLowerCase() ===
                        'emergency'
                    ).length
                  }
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  In the loaded history
                </p>
              </div>
              <div className="rounded-xl bg-red-500/10 p-3 text-red-500">
                <Bell className="h-5 w-5" />
              </div>
            </div>

            <div className={`${cardClass} flex items-center justify-between rounded-xl p-4`}>
              <div>
                <p className="text-xs font-bold text-slate-400">
                  Delivery Status
                </p>
                <h3 className="mt-1 text-lg font-extrabold">
                  Backend required
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Delivery receipts are not confirmed here
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Composer */}
            <section className={`${cardClass} space-y-5 rounded-xl p-5 lg:col-span-2`}>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Radio className="h-4 w-4 text-pdp" />
                  Create Broadcast
                </h3>
                <span className="rounded-full border border-slate-500/30 px-3 py-1 text-xs text-slate-500">
                  <Shield className="mr-1 inline h-3.5 w-3.5" />
                  Situation Room
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    Target Recipients
                  </label>
                  <select
                    value={targetScope}
                    onChange={(event) => setTargetScope(event.target.value)}
                    className={inputClass}
                  >
                    {recipientOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    Urgency Level
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUrgency('Normal')}
                      className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition ${
                        urgency === 'Normal'
                          ? 'bg-pdp text-white'
                          : isDark
                            ? 'bg-slate-900 text-slate-400'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('Emergency')}
                      className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition ${
                        urgency === 'Emergency'
                          ? 'bg-red-500 text-white'
                          : isDark
                            ? 'bg-slate-900 text-slate-400'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Emergency
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-500">
                  Broadcast Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter broadcast title..."
                  maxLength={150}
                  className={inputClass}
                />
                <p className="mt-1 text-right text-[10px] text-slate-500">
                  {title.length}/150
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-500">
                  Message Content
                </label>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write your announcement or alert..."
                  maxLength={5000}
                  className={inputClass}
                />
                <p className="mt-1 text-right text-[10px] text-slate-500">
                  {message.length}/5000
                </p>
              </div>

              {urgency === 'Emergency' && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Emergency broadcasts should be used only for urgent
                  operational information.
                </div>
              )}

              <div className={`flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Paperclip className="h-4 w-4" />
                  <ImageIcon className="h-4 w-4" />
                  Attachments are not enabled yet
                </div>

                <button
                  type="button"
                  disabled={sending || !title.trim() || !message.trim()}
                  onClick={() => {
                    setError('')
                    setSuccess('')
                    setConfirmSend(true)
                  }}
                  className="flex items-center gap-2 rounded-xl bg-pdp px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-pdp-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Review Broadcast
                </button>
              </div>
            </section>

            {/* Broadcast history */}
            <section className={`${cardClass} space-y-4 rounded-xl p-5`}>
              <div className="flex items-center justify-between border-b border-slate-700/30 pb-3">
                <h3 className="text-sm font-bold">Broadcast History</h3>
                <button
                  type="button"
                  onClick={loadAnnouncements}
                  disabled={loading}
                  title="Refresh history"
                  className="rounded-lg p-2 text-slate-400 hover:text-pdp disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>

              {loading && announcements.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-500">
                  Loading broadcast history...
                </p>
              )}

              {!loading && announcements.length === 0 && (
                <div className="py-8 text-center">
                  <Radio className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold">
                    No broadcasts found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Sent broadcasts will appear here.
                  </p>
                </div>
              )}

              <div className="max-h-[600px] space-y-3 overflow-y-auto">
                {announcements.map((item, index) => {
                  const emergency =
                    String(item.urgency || '').toLowerCase() === 'emergency'

                  return (
                    <article
                      key={item.id ?? index}
                      className={`space-y-2 rounded-xl border p-3 ${
                        isDark
                          ? 'bg-slate-900/60 border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold">
                          {item.title || 'Untitled broadcast'}
                        </h4>
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-[9px] font-extrabold ${
                            emergency
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-emerald-500/20 text-emerald-500'
                          }`}
                        >
                          {item.urgency || 'Normal'}
                        </span>
                      </div>

                      <p className="line-clamp-3 whitespace-pre-wrap text-xs text-slate-500">
                        {item.message || item.content || 'No message content'}
                      </p>

                      <div className="space-y-1 border-t border-slate-700/20 pt-2 text-[10px] text-slate-500">
                        <p className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Target: {item.target_role || item.target || 'Not specified'}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(
                            item.created_at || item.sent_at || item.timestamp
                          )}
                        </p>
                        <p>
                          Delivery: {item.delivery_status || item.status || 'Not reported'}
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Confirmation dialog */}
      {confirmSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className={`${cardClass} w-full max-w-md space-y-4 rounded-xl p-5 shadow-2xl`}
          >
            <div className="flex items-center gap-2">
              {urgency === 'Emergency' ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Radio className="h-5 w-5 text-pdp" />
              )}
              <h3 className="text-base font-bold">Confirm Broadcast</h3>
            </div>

            <p className="text-sm text-slate-500">
              You are about to send this broadcast to the selected recipient
              group.
            </p>

            <div className={`space-y-2 rounded-lg p-3 ${
              isDark ? 'bg-slate-900' : 'bg-slate-50'
            }`}>
              <p className="text-xs font-bold">{title}</p>
              <p className="whitespace-pre-wrap text-xs text-slate-500">
                {message}
              </p>
              <div className="border-t border-slate-700/20 pt-2 text-xs text-slate-500">
                <p>Recipients: {targetScope}</p>
                <p>Urgency: {urgency}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              The server must confirm dispatch. This page does not independently
              verify push notification delivery.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => setConfirmSend(false)}
                className={`rounded-lg px-4 py-2 text-xs font-bold ${
                  isDark
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={handleSendBroadcast}
                className={`rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${
                  urgency === 'Emergency'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-pdp hover:bg-pdp-dark'
                }`}
              >
                {sending ? 'Sending...' : 'Confirm and Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}