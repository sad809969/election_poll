
import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import {
  Vote,
  Landmark,
  Download,
  Layers,
  Building2,
} from 'lucide-react'

const ELECTION_OFFICES = [
  {
    id: 'gov',
    title: 'Governorship Election',
    subtitle: 'Executive Governor and Deputy Governor (Statewide)',
    icon: Landmark,
    category: 'State',
    date: 'Election date to be confirmed',
  },
  {
    id: 'senate',
    title: 'Senatorial Election',
    subtitle: 'Senate of the Federal Republic (3 Senatorial Districts)',
    icon: Vote,
    category: 'Federal',
    date: 'Election date to be confirmed',
  },
  {
    id: 'reps',
    title: 'House of Representatives Election',
    subtitle: 'National Assembly Federal Constituencies',
    icon: Building2,
    category: 'Federal',
    date: 'Election date to be confirmed',
  },
  {
    id: 'assembly',
    title: 'State House of Assembly Election',
    subtitle: 'Jigawa State House of Assembly',
    icon: Layers,
    category: 'State',
    date: 'Election date to be confirmed',
  },
]

export default function ElectionResultsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [selectedOfficeId, setSelectedOfficeId] = useState('gov')

  const currentOffice =
    ELECTION_OFFICES.find((office) => office.id === selectedOfficeId) ||
    ELECTION_OFFICES[0]

  const cardClass = isDark
    ? 'bg-[#141E38] border-slate-800'
    : 'bg-white border-slate-200 shadow-sm'

  const exportToCsv = () => {
    const csvContent = [
      'Jigawa PDP PollWatch 2027 - Results Export',
      `Election Office,${currentOffice.title}`,
      `Election Date,${currentOffice.date}`,
      '',
      'No election results are currently available.',
    ].join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `Jigawa_${currentOffice.id}_results_2027.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
        isDark
          ? 'bg-[#070D1E] text-slate-100'
          : 'bg-slate-50 text-slate-800'
      }`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Election Results"
          subtitle="Monitoring results for Governorship, Senate, House of Representatives, and State House of Assembly elections"
        />

        <main className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ELECTION_OFFICES.map((office) => {
              const Icon = office.icon
              const isSelected = selectedOfficeId === office.id

              return (
                <button
                  key={office.id}
                  onClick={() => setSelectedOfficeId(office.id)}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-pdp text-white shadow-lg shadow-pdp/25 border-emerald-400 font-bold'
                      : isDark
                        ? 'bg-[#141E38] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-black/25 text-emerald-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {office.category}
                    </span>
                    <Icon className="w-5 h-5 opacity-80" />
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-black tracking-tight leading-snug">
                      {office.title}
                    </h4>
                    <p
                      className={`text-[10px] mt-1 ${
                        isSelected ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      Results pending
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div
            className={`${cardClass} border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-pdp">
                  {currentOffice.category} Election
                </span>
                <span className="text-xs text-slate-400">
                  • {currentOffice.date}
                </span>
              </div>

              <h2
                className={`text-lg sm:text-xl font-black mt-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {currentOffice.title}
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                {currentOffice.subtitle}
              </p>
            </div>

            <button
              onClick={exportToCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pdp hover:bg-pdp-dark text-white font-bold text-xs shadow-lg shadow-pdp/20 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export to CSV</span>
            </button>
          </div>

          <div
            className={`${cardClass} border rounded-2xl p-8 text-center`}
          >
            <Vote className="w-10 h-10 mx-auto mb-3 text-slate-400" />

            <h3 className="text-lg font-bold">
              No Election Results Available
            </h3>

            <p className="text-sm text-slate-400 mt-2">
              Results for this election have not yet been submitted.
              They will appear here when data becomes available.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}