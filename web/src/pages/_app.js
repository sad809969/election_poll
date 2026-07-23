import { createContext, useContext, useState, useEffect } from 'react'
import '../styles/globals.css'
import Head from 'next/head'

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
        <Component {...pageProps} />
      </div>
    </ThemeContext.Provider>
  )
}
