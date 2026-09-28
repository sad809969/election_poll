import { createContext, useContext, useState, useEffect } from 'react'
import '../styles/globals.css'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { getCurrentUser, getToken, logoutUser, refreshCurrentUser } from '../lib/api'
import { canAccessPage, homePathFor } from '../lib/access'

const PUBLIC_PATHS = ['/login']

export const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  mobileOpen: false,
  toggleMobile: () => {},
  closeMobile: () => {}
})

export const useTheme = () => useContext(ThemeContext)

export default function App({ Component, pageProps }) {
  const [theme, setThemeState] = useState('dark')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const isPublicPage = PUBLIC_PATHS.includes(router.pathname)

  const [noAccess, setNoAccess] = useState(false)

  // Route guard: every page except sign-in needs a session, and each role
  // may only open the pages it has been granted. Anything else is sent to
  // the user's own landing page.
  useEffect(() => {
    if (!router.isReady) return
    let cancelled = false

    const check = async () => {
      setNoAccess(false)
      if (isPublicPage) {
        setAuthChecked(true)
        return
      }
      if (!getToken()) {
        setAuthChecked(false)
        const next = encodeURIComponent(router.asPath)
        router.replace(router.asPath === '/' ? '/login' : `/login?next=${next}`)
        return
      }

      // Use the stored profile immediately, then refresh it from the server
      // so permission changes apply without signing out.
      let user = getCurrentUser()
      if (!authChecked || !user) {
        user = (await refreshCurrentUser()) || user
      }
      if (cancelled) return
      if (!getToken() || !user) {
        router.replace('/login')
        return
      }

      if (canAccessPage(user, router.asPath)) {
        setAuthChecked(true)
        return
      }

      const home = homePathFor(user)
      if (home && home !== router.asPath.split('?')[0]) {
        setAuthChecked(false)
        router.replace(home)
      } else {
        setNoAccess(true)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [router.isReady, router.asPath])

  useEffect(() => {
    const saved = localStorage.getItem('jigawa_pollwatch_theme')
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    localStorage.setItem('jigawa_pollwatch_theme', next)
  }

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('jigawa_pollwatch_theme', newTheme)
  }

  const toggleMobile = () => setMobileOpen(prev => !prev)
  const closeMobile = () => setMobileOpen(false)

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mobileOpen, toggleMobile, closeMobile }}>
      <Head>
        <title>Jigawa PDP PollWatch 2027 — Situation Room</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="description" content="Election Situation Room & Monitoring System 2027 for Jigawa PDP" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={theme === 'dark' ? 'dark-body' : 'light-body'}>
        {noAccess ? (
          <NoAccessNotice onSignOut={() => { logoutUser(); router.replace('/login') }} />
        ) : (
          (isPublicPage || authChecked) && <Component {...pageProps} />
        )}
      </div>
    </ThemeContext.Provider>
  )
}


function NoAccessNotice({ onSignOut }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#070D1E] text-slate-200">
      <div className="max-w-sm text-center space-y-3">
        <h1 className="text-lg font-black">No pages assigned</h1>
        <p className="text-xs text-slate-400">
          Your account has not been granted access to any part of the dashboard.
          Please contact the Situation Room administrator.
        </p>
        <button
          onClick={onSignOut}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
