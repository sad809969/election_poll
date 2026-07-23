import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Jigawa PDP PollWatch 2027 — Situation Room</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Election Situation Room & Monitoring System 2027 for Jigawa PDP" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
