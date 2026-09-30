import { useState, useEffect, useMemo, useCallback } from 'react'
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
  RefreshCw,
  AlertTriangle,
  Clock,
  Shield,
} from 'lucide-react'

const recipientOptions = [
  { value: 'agents', label: 'All Polling Unit Agents' },
  { value: 'lga', label: 'LGA Coordinators' },
  { value: 'ward', label: 'Ward Coordinators' },
  { value: 'all', label: 'All Agents and Coordinators' },
]

const messageTypes = [
  { value: 'message', label: 'General Message' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'alert', label: 'Emergency Alert' },
]

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString()
}

function getMessageText(message) {
  return (
    message?.content ||
    message?.message ||
    message?.text ||
    message?.body ||
    ''
  )
}

function getMessageDate(message) {
  return (
    message?.created_at ||
    message?.sent_at ||
    message?.timestamp ||
    message?.date ||
    null
  )
}

function getMessageType(message) {
  return String(message?.message_type || message?.type || 'message')
    .toLowerCase()
}

export default function CommunicationCenterPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [messages, setMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [recipient, setRecipient] = useState('agents')
  const [messageType, setMessageType] = useState('message')
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
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

  const loadMessages = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiFetch('/communication/messages')

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data?.messages)
          ? data.messages
          : Array.isArray(data?.items)
            ? data.items
            : []

      setMessages(records)
    } catch (err) {
      console.error('Failed to load communication messages:', err)
      setError('Unable to load messages. Please check the backend connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return messages.filter((message) => {
      const text = getMessageText(message).toLowerCase()
      const sender = String(
        message?.sender_name || message?.sender || message?.created_by || ''
      ).toLowerCase()

      const matchesSearch =
        !query || text.includes(query) || sender.includes(query)

      const type = getMessageType(message)
      const matchesChannel =
        selectedChannel === 'all' ||
        (selectedChannel === 'announcements' && type === 'announcement') ||
        (selectedChannel === 'alerts' && type === 'alert')

      return matchesSearch && matchesChannel
    })
  }, [messages, searchQuery, selectedChannel])

  const totalMessages = messages.length
  const announcements = messages.filter(
    (message) => getMessageType(message) === 'announcement'
  ).length
  const alerts = messages.filter(
    (message) => getMessageType(message) === 'alert'
  ).length

  async function handleSendMessage(event) {
    event.preventDefault()

    const content = messageText.trim()

    if (!content) {
      setError('Please enter a message before sending.')
      return
    }

    if (!recipient) {
      setError('Please select a recipient.')
      return
    }

    setSending(true)
    setError('')
    setSuccess('')

    try {
      // This uses the existing messages endpoint.
      // The backend must support POST /communication/messages
      // and accept the fields below.
      const result = await apiFetch('/communication/messages', {
        method: 'POST',
        body: JSON.stringify({
          content,
          recipient,
          message_type: messageType,
        }),
      })

      if (result) {
        setMessages((previous) => {
          const newMessage = result.message || result
          if (!newMessage || !getMessageText(newMessage)) return previous

          return [newMessage, ...previous]
        })
      }

      setMessageText('')
      setSuccess('Message submitted successfully.')
      await loadMessages()
    } catch (err) {
      console.error('Failed to send message:', err)
      setError(
        'Message could not be sent. Check that the backend supports sending messages.'
      )
    } finally {
      setSending(false)
    }
  }

  const channelButtonClass = (active) =>
    `w-full flex items-center justify-between rounded-lg border p-3 text-left transition ${
      active
        ? 'bg-pdp/10 border-pdp'
        : isDark
          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
    }`

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors ${
        isDark
          ? 'bg-[#070D1E] text-slate-100'
          : 'bg-slate-50 text-slate-800'
      }`}
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Header
          title="Communication Centre"
          subtitle="Manage messages, announcements, and operational alerts"
        />

        <main className="space-y-6 p-4 md:p-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={`${cardClass} flex items-center justify-between rounded-xl p-4`}>
              <div>
                <p className="text-xs font-bold text-slate-400">Messages</p>
                <h3 className="mt-1 text-2xl font-extrabold">
                  {totalMessages}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Loaded from the server
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>

            <div className={`${cardClass} flex items-center justify-between rounded-xl p-4`}>
              <div>
                <p className="text-xs font-bold text-slate-400">Recipients</p>
                <h3 className="mt-1 text-2xl font-extrabold">—</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Not provided by the API
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className={`${cardClass} flex items-center justify-between rounded-xl p-4`}>
              <div>
                <p className="text-xs font-bold text-slate-400">Announcements</p>
                <h3 className="mt-1 text-2xl font-extrabold">
                  {announcements}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  In the loaded messages
                </p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3 text-purple-500">
                <Radio className="h-5 w-5" />
              </div>
            </div>

            <div className={`${cardClass} flex items-center justify-between rounded-xl p-4`}>
              <div>
                <p className="text-xs font-bold text-slate-400">Alerts</p>
                <h3 className="mt-1 text-2xl font-extrabold">{alerts}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  In the loaded messages
                </p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-500">
                <Bell className="h-5 w-5" />
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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Message filters */}
            <section className={`${cardClass} rounded-xl p-4`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold">Message Centre</h3>
                <button
                  type="button"
                  onClick={loadMessages}
                  disabled={loading}
                  title="Refresh messages"
                  className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-pdp disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search messages..."
                  className={`${inputClass} pl-9`}
                />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel('all')}
                  className={channelButtonClass(selectedChannel === 'all')}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="h-4 w-4 text-blue-500" />
                    All Messages
                  </span>
                  <span className="text-xs text-slate-400">
                    {messages.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('announcements')}
                  className={channelButtonClass(
                    selectedChannel === 'announcements'
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Radio className="h-4 w-4 text-purple-500" />
                    Announcements
                  </span>
                  <span className="text-xs text-slate-400">
                    {announcements}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('alerts')}
                  className={channelButtonClass(selectedChannel === 'alerts')}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Bell className="h-4 w-4 text-amber-500" />
                    Emergency Alerts
                  </span>
                  <span className="text-xs text-slate-400">{alerts}</span>
                </button>
              </div>

              <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Communication access
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Recipient permissions and delivery tracking should be
                  enforced by the backend.
                </p>
              </div>
            </section>

            {/* Message list */}
            <section className={`${cardClass} flex min-h-[520px] flex-col rounded-xl p-4 xl:col-span-2`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/50 pb-3">
                <div>
                  <h3 className="text-sm font-bold">
                    {selectedChannel === 'all'
                      ? 'All Messages'
                      : selectedChannel === 'announcements'
                        ? 'Announcements'
                        : 'Emergency Alerts'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {filteredMessages.length} message(s) displayed
                  </p>
                </div>
                <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs text-slate-500">
                  {loading ? 'Loading...' : 'Server data'}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {loading && messages.length === 0 && (
                  <div className="py-12 text-center text-sm text-slate-500">
                    Loading messages...
                  </div>
                )}

                {!loading && filteredMessages.length === 0 && (
                  <div className="py-12 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 text-sm font-semibold">
                      No messages found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Messages will appear here when available from the
                      backend.
                    </p>
                  </div>
                )}

                {filteredMessages.map((message, index) => {
                  const type = getMessageType(message)
                  const text = getMessageText(message)
                  const sender =
                    message?.sender_name ||
                    message?.sender ||
                    message?.created_by ||
                    'Unknown sender'
                  const id = message?.id ?? message?.message_id ?? index

                  return (
                    <article
                      key={id}
                      className={`rounded-xl border p-4 ${
                        isDark
                          ? 'border-slate-800 bg-slate-900/60'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`rounded-lg p-2 ${
                              type === 'alert'
                                ? 'bg-amber-500/10 text-amber-500'
                                : type === 'announcement'
                                  ? 'bg-purple-500/10 text-purple-500'
                                  : 'bg-blue-500/10 text-blue-500'
                            }`}
                          >
                            {type === 'alert' ? (
                              <Bell className="h-4 w-4" />
                            ) : type === 'announcement' ? (
                              <Radio className="h-4 w-4" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{sender}</p>
                            <p className="text-xs text-slate-500">
                              {formatDate(getMessageDate(message))}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                            type === 'alert'
                              ? 'bg-amber-500/10 text-amber-500'
                              : type === 'announcement'
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-blue-500/10 text-blue-500'
                          }`}
                        >
                          {type}
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                        {text || 'No message content'}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-700/20 pt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {message?.recipient_name ||
                            message?.recipient ||
                            message?.target ||
                            'Recipient not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {message?.status || 'Status unavailable'}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          </div>

          {/* New message composer */}
          <section className={`${cardClass} rounded-xl p-5`}>
            <div className="mb-4 flex items-center gap-2 border-b border-slate-700/50 pb-3">
              <Send className="h-4 w-4 text-pdp" />
              <h3 className="text-sm font-bold">Compose New Message</h3>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    Send message to
                  </label>
                  <select
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
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
                    Message type
                  </label>
                  <select
                    value={messageType}
                    onChange={(event) => setMessageType(event.target.value)}
                    className={inputClass}
                  >
                    {messageTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-500">
                  Message content
                </label>
                <textarea
                  rows={5}
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Type your message here..."
                  className={inputClass}
                />
              </div>

              {messageType === 'alert' && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Emergency alerts should be reserved for urgent operational
                  information.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  The server must confirm successful delivery.
                </p>

                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-pdp px-5 py-2.5 text-sm font-bold text-white transition hover:bg-pdp-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  )
}