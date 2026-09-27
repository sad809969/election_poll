import { useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useTheme } from './_app'
import { 
  Vote, 
  Landmark, 
  Download, 
  FileSpreadsheet, 
  Layers, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp, 
  ChevronRight,
  Search,
  Filter
} from 'lucide-react'

// Election types available in Jigawa State
const ELECTION_OFFICES = [
  {
    id: 'gov',
    title: 'Governorship Election',
    subtitle: 'Executive Governor & Deputy Governor (Statewide)',
    icon: Landmark,
    category: 'State',
    date: 'Election date to be confirmed',
    totalPus: 0,
    reportingPus: 0,
    results: [],
    constituencies: [],
  },
  {
    id: 'senate',
    title: 'Senatorial Election',
    subtitle: 'Senate of the Federal Republic (3 Senatorial Districts)',
    icon: Vote,
    category: 'Federal',
    date: 'Election date to be confirmed',
    totalPus: 0,
    reportingPus: 0,
    subDistricts: [],
  },
  {
    id: 'reps',
    title: 'House of Representatives Election',
    subtitle: 'National Assembly Federal Constituencies',
    icon: Building2,
    category: 'Federal',
    date: 'Election date to be confirmed',
    totalPus: 0,
    reportingPus: 0,
    constituencies: [],
  },
  {
    id: 'assembly',
    title: 'State House of Assembly Election',
    subtitle: 'Jigawa State House of Assembly',
    icon: Layers,
    category: 'State',
    date: 'Election date to be confirmed',
    totalPus: 0,
    reportingPus: 0,
    summarySeats: [],
    sampleSeats: [],
  },
]

export default function ElectionResultsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [selectedOfficeId, setSelectedOfficeId] = useState('gov')
  const [selectedSenDistrict, setSelectedSenDistrict] = useState('sen-ne')
  const [searchQuery, setSearchQuery] = useState('')

  const currentOffice = useMemo(() => {
    return ELECTION_OFFICES.find(o => o.id === selectedOfficeId) || ELECTION_OFFICES[0]
  }, [selectedOfficeId])

  // CSV Export Generator
  const exportToCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += `Jigawa PDP PollWatch 2027 - Official Results Export\n`
    csvContent += `Election Office: ${currentOffice.title} (${currentOffice.subtitle})\n`
    csvContent += `Election Date: ${currentOffice.date}\n`
    csvContent += `Total Polling Units: ${currentOffice.totalPus}, Collated: ${currentOffice.reportingPus}\n\n`

    if (currentOffice.results) {
      csvContent += `Party,Candidate,Votes Received,Vote Share %,Status\n`
      currentOffice.results.forEach(r => {
        csvContent += `"${r.party}","${r.candidate}",${r.votes},"${r.share}","${r.status}"\n`
      })
    } else if (currentOffice.id === 'senate') {
      csvContent += `Senatorial District,Party,Candidate,Votes Received,Vote Share %\n`
      currentOffice.subDistricts.forEach(d => {
        d.results.forEach(r => {
          csvContent += `"${d.name}","${r.party}","${r.candidate}",${r.votes},"${r.share}"\n`
        })
      })
    } else if (currentOffice.id === 'reps') {
      csvContent += `Federal Constituency,PDP Candidate,PDP Votes,APC Candidate,APC Votes,Leading Party\n`
      currentOffice.constituencies.forEach(c => {
        csvContent += `"${c.name}","${c.pdp}",${c.pdpVotes},"${c.apc}",${c.apcVotes},"${c.winner}"\n`
      })
    } else if (currentOffice.id === 'assembly') {
      csvContent += `State Constituency,Leading / Elected Candidate,Lead Margin\n`
      currentOffice.sampleSeats.forEach(s => {
        csvContent += `"${s.constituency}","${s.winner}","${s.margin}"\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Jigawa_${currentOffice.id}_results_2027.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const cardClass = isDark ? 'bg-[#141E38] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
  const subcardClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Official Results & Multi-Election Telemetry" 
          subtitle="Comprehensive INEC ballots collation across Presidential, Senate, House of Reps, Governorship, and Assembly" 
        />

        <main className="p-4 sm:p-6 space-y-6">
          {/* Top Office Selector Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ELECTION_OFFICES.map((office) => {
              const Icon = office.icon
              const isSelected = selectedOfficeId === office.id

              return (
                <button
                  key={office.id}
                  onClick={() => setSelectedOfficeId(office.id)}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-pdp text-white shadow-lg shadow-pdp/25 border-emerald-400 font-bold'
                      : isDark
                        ? 'bg-[#141E38] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      isSelected ? 'bg-black/25 text-emerald-100' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {office.category}
                    </span>
                    <Icon className="w-4 h-4 opacity-80" />
                  </div>
                  <div className="mt-3">
                    <h4 className="text-xs font-black tracking-tight leading-snug line-clamp-1">{office.title}</h4>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {office.reportingPus.toLocaleString()} / {office.totalPus.toLocaleString()} PUs
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Active Office Banner & Actions */}
          <div className={`${cardClass} border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-pdp">
                  {currentOffice.category} Election Telemetry
                </span>
                <span className="text-xs text-slate-400">• {currentOffice.date}</span>
              </div>
              <h2 className={`text-lg sm:text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentOffice.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{currentOffice.subtitle}</p>
            </div>

            {/* Export & Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCsv}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pdp hover:bg-pdp-dark text-white font-bold text-xs shadow-lg shadow-pdp/20 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Export to CSV</span>
              </button>
            </div>
          </div>

          {/* Office-Specific Renderers */}
          {currentOffice.totalPus === 0 && (
  <div className={`${cardClass} border rounded-2xl p-8 text-center`}>
    <Vote className="w-10 h-10 mx-auto mb-3 text-slate-400" />
    <h3 className="text-lg font-bold">
      No Election Results Available
    </h3>
    <p className="text-sm text-slate-400 mt-2">
      Results for this election have not yet been submitted.
      They will appear here when data becomes available.
    </p>
  </div>
)}
          {/* 1. GOVERNORSHIP / PRESIDENTIAL VIEW */}
          {(currentOffice.id === 'gov' || currentOffice.id === 'presidential') && currentOffice.results && (
            <div className="space-y-6">
              {/* Vote Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentOffice.results.map((res) => (
                  <div key={res.party} className={`${cardClass} border rounded-xl p-4 space-y-2 relative overflow-hidden`}>
                    <div 
                      className="absolute top-0 left-0 right-0 h-1.5" 
                      style={{ backgroundColor: res.color }} 
                    />
                    <div className="flex justify-between items-start pt-1">
                      <div>
                        <span className="text-sm font-black tracking-tight" style={{ color: res.color }}>{res.party}</span>
                        <p className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{res.candidate}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        res.status === 'Leading' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-baseline justify-between">
                      <span className="text-xl font-black text-white">{res.votes.toLocaleString()}</span>
                      <span className="text-xs font-mono font-bold text-slate-400">{res.share}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Regional Breakdown if Governorship */}
              {currentOffice.constituencies && (
                <div className={`${cardClass} border rounded-2xl p-5 space-y-3`}>
                  <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Emirate & Zone Collation Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {currentOffice.constituencies.map((zone) => (
                      <div key={zone.name} className={`${subcardClass} border rounded-xl p-3 space-y-1.5`}>
                        <h4 className="text-xs font-bold text-slate-300 line-clamp-1">{zone.name}</h4>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-emerald-400 font-bold">PDP: {zone.pdp.toLocaleString()}</span>
                          <span className="text-blue-400 font-bold">APC: {zone.apc.toLocaleString()}</span>
                        </div>
                        <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Leader: {zone.leader}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. SENATORIAL ELECTION VIEW */}
          {currentOffice.id === 'senate' && currentOffice.subDistricts && (
            <div className="space-y-6">
              {/* Senatorial District Switcher Tabs */}
              <div className="flex flex-wrap gap-2">
                {currentOffice.subDistricts.map((dist) => (
                  <button
                    key={dist.id}
                    onClick={() => setSelectedSenDistrict(dist.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                      selectedSenDistrict === dist.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : isDark ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {dist.name}
                  </button>
                ))}
              </div>

              {/* District Detail View */}
              {(() => {
                const dist = currentOffice.subDistricts.find(d => d.id === selectedSenDistrict) || currentOffice.subDistricts[0]
                return (
                  <div className="space-y-4">
                    <div className={`${subcardClass} border rounded-xl p-4`}>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Jurisdiction & Covered LGAs:</span>
                      <p className="text-xs font-medium text-slate-200 mt-0.5">{dist.lgas}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {dist.results.map((r) => (
                        <div key={r.party} className={`${cardClass} border rounded-xl p-4 space-y-2 relative overflow-hidden`}>
                          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: r.color }} />
                          <div className="flex justify-between items-start pt-1">
                            <div>
                              <span className="text-sm font-black" style={{ color: r.color }}>{r.party}</span>
                              <h4 className="text-xs font-bold text-white line-clamp-1">{r.candidate}</h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === 'Leading' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                            }`}>{r.status}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                            <span className="text-xl font-black text-white">{r.votes.toLocaleString()}</span>
                            <span className="text-xs font-mono text-slate-400">{r.share}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* 3. HOUSE OF REPRESENTATIVES (11 CONSTITUENCIES) */}
          {currentOffice.id === 'reps' && currentOffice.constituencies && (
            <div className={`${cardClass} border rounded-2xl p-5 space-y-4`}>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  11 Federal Constituencies of Jigawa State
                </h3>
                <span className="text-[10px] font-mono text-slate-400">11 of 11 Constituencies Active</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-2.5">Federal Constituency</th>
                      <th className="pb-2.5">PDP Candidate & Votes</th>
                      <th className="pb-2.5">APC Candidate & Votes</th>
                      <th className="pb-2.5 text-right">Lead Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {currentOffice.constituencies.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-bold text-white">{c.name}</td>
                        <td className="py-3 text-emerald-400 font-semibold">
                          {c.pdp} — <span className="font-bold font-mono">{c.pdpVotes.toLocaleString()}</span>
                        </td>
                        <td className="py-3 text-blue-400 font-semibold">
                          {c.apc} — <span className="font-bold font-mono">{c.apcVotes.toLocaleString()}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {c.winner} Leading
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. STATE HOUSE OF ASSEMBLY (30 SEATS) */}
          {currentOffice.id === 'assembly' && currentOffice.summarySeats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {currentOffice.summarySeats.map((s) => (
                  <div key={s.party} className={`${cardClass} border rounded-xl p-4 space-y-1`}>
                    <span className="text-xs font-bold text-slate-400">{s.party} Assembly Seats</span>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-2xl font-black text-white">{s.seatsWon} Seats</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{s.share}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`${cardClass} border rounded-2xl p-5 space-y-3`}>
                <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Selected State Assembly Key Races
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentOffice.sampleSeats.map((seat, i) => (
                    <div key={i} className={`${subcardClass} border rounded-xl p-3 flex justify-between items-center`}>
                      <div>
                        <h4 className="text-xs font-bold text-white">{seat.constituency}</h4>
                        <span className="text-[10px] text-emerald-400 font-semibold">{seat.winner}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">{seat.margin}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
