
import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTheme } from '../pages/_app'
import {
  MapPin,
  ChevronRight,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from 'lucide-react'

// Jigawa State's 27 LGAs.
// These positions are illustrative SVG layout coordinates,
// not surveyed GPS coordinates.
const JIGAWA_27_LGAS = [
  { id: 'kz', name: 'Kazaure', zone: 'Kazaure Emirate', x: 88, y: 124 },
  { id: 'rn', name: 'Roni', zone: 'Kazaure Emirate', x: 62, y: 142 },
  { id: 'gw', name: 'Gwiwa', zone: 'Kazaure Emirate', x: 116, y: 114 },
  { id: 'yw', name: 'Yankwashi', zone: 'Kazaure Emirate', x: 110, y: 94 },
  { id: 'bb', name: 'Babura', zone: 'Ringim / North-West', x: 178, y: 100 },
  { id: 'gk', name: 'Garki', zone: 'Ringim Zone', x: 275, y: 156 },
  { id: 'rg', name: 'Ringim', zone: 'Ringim Zone', x: 268, y: 206 },
  { id: 'tr', name: 'Taura', zone: 'Ringim Zone', x: 338, y: 190 },
  { id: 'st', name: 'Sule Tankarkar', zone: 'Gumel Emirate', x: 288, y: 116 },
  { id: 'gm', name: 'Gumel', zone: 'Gumel Emirate', x: 332, y: 126 },
  { id: 'mg', name: 'Maigatari', zone: 'Gumel Emirate', x: 348, y: 88 },
  { id: 'gg', name: 'Gagarawa', zone: 'Gumel Emirate', x: 366, y: 162 },
  { id: 'dt', name: 'Dutse', zone: 'Dutse Emirate (Capital)', x: 318, y: 276 },
  { id: 'ky', name: 'Kiyawa', zone: 'Dutse Emirate', x: 382, y: 270 },
  { id: 'jh', name: 'Jahun', zone: 'Dutse Emirate', x: 386, y: 216 },
  { id: 'mi', name: 'Miga', zone: 'Dutse Emirate', x: 412, y: 204 },
  { id: 'bj', name: 'Buji', zone: 'Dutse Emirate', x: 404, y: 312 },
  { id: 'bk', name: 'Birnin Kudu', zone: 'Dutse Emirate', x: 352, y: 332 },
  { id: 'gwm', name: 'Gwaram', zone: 'Dutse Emirate', x: 450, y: 360 },
  { id: 'kg', name: 'Kaugama', zone: 'Hadejia Emirate', x: 424, y: 154 },
  { id: 'mm', name: 'Malam Madori', zone: 'Hadejia Emirate', x: 478, y: 132 },
  { id: 'hd', name: 'Hadejia', zone: 'Hadejia Emirate', x: 494, y: 154 },
  { id: 'au', name: 'Auyo', zone: 'Hadejia Emirate', x: 490, y: 174 },
  { id: 'kf', name: 'Kafin Hausa', zone: 'Hadejia Emirate', x: 458, y: 194 },
  { id: 'kr', name: 'Kirikasamma', zone: 'Hadejia Emirate', x: 538, y: 122 },
  { id: 'bw', name: 'Birniwa', zone: 'Hadejia Emirate', x: 540, y: 92 },
  { id: 'gr', name: 'Guri', zone: 'Hadejia Emirate', x: 588, y: 106 },
]

const STATUS_STYLES = {
  Critical: {
    dot: '#EF4444',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  Attention: {
    dot: '#F59E0B',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  Normal: {
    dot: '#10B981',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  Unknown: {
    dot: '#94A3B8',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  },
}

export default function JigawaMap() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedLga, setSelectedLga] = useState(null)
  const [hoveredLga, setHoveredLga] = useState(null)

  // Until real operational reports are connected,
  // all LGAs correctly remain in the unknown state.
  const lgaTelemetry = useMemo(
    () =>
      JIGAWA_27_LGAS.map((lga) => ({
        ...lga,
        status: 'Unknown',
        incidentsCount: null,
        agentsCheckedIn: null,
        pollingUnitsReady: null,
        lastUpdated: null,
      })),
    []
  )

  const counts = useMemo(() => {
    const result = {
      Normal: 0,
      Attention: 0,
      Critical: 0,
      Unknown: 0,
    }

    lgaTelemetry.forEach((lga) => {
      result[lga.status] += 1
    })

    return result
  }, [lgaTelemetry])

  const filteredLgas = useMemo(() => {
    if (activeFilter === 'All') return lgaTelemetry
    return lgaTelemetry.filter((lga) => lga.status === activeFilter)
  }, [activeFilter, lgaTelemetry])

  const currentDisplay =
    hoveredLga ||
    selectedLga ||
    lgaTelemetry.find((lga) => lga.name === 'Dutse')

  const cardClass = isDark
    ? 'bg-[#141E38] border-slate-800'
    : 'bg-white border-slate-200 shadow-sm'

  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200'

  return (
    <div
      className={`relative w-full rounded-2xl border flex flex-col overflow-hidden transition-colors duration-200 ${cardClass}`}
    >
      <div
        className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${borderClass}`}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-sm font-black tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Jigawa State Operational Map
            </h3>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Pre-election monitoring
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Operational readiness and reported concerns across the 27 LGAs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {['All', 'Critical', 'Attention', 'Normal', 'Unknown'].map(
            (filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1.5 rounded-lg font-bold border transition ${
                  activeFilter === filter
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-transparent text-slate-400 border-transparent hover:border-slate-600'
                }`}
              >
                {filter} ({filter === 'All' ? lgaTelemetry.length : counts[filter]})
              </button>
            )
          )}
        </div>
      </div>

      <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden bg-[#0A1128]">
        <svg
          viewBox="0 0 650 440"
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Illustrative operational map of Jigawa State showing its 27 local government areas"
        >
          <defs>
            <pattern
              id="jigawa-grid"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 30 0 L 0 0 0 30"
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="1"
              />
            </pattern>

            <linearGradient id="state-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B3C26" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#062817" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#041B10" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#jigawa-grid)" />

          <path
            d="
              M 55,145
              C 50,130 70,110 88,110
              C 98,80 115,85 140,88
              C 160,82 175,95 210,95
              C 250,92 280,105 320,100
              C 340,75 360,78 385,82
              C 430,80 480,75 525,82
              C 555,85 575,95 605,105
              C 615,120 600,140 575,150
              C 550,165 520,175 500,185
              C 485,210 475,260 480,310
              C 485,345 465,385 440,380
              C 410,375 390,340 370,345
              C 340,350 320,325 310,295
              C 295,280 270,270 250,250
              C 230,225 240,190 220,180
              C 190,170 150,165 110,165
              C 80,165 60,160 55,145
              Z
            "
            fill="url(#state-grad)"
            stroke="#10B981"
            strokeWidth="2"
            strokeDasharray="6 3"
          />

          <g
            stroke="rgba(16, 185, 129, 0.2)"
            strokeWidth="1"
            strokeDasharray="3 3"
          >
            <path d="M 140,88 C 160,130 190,170 220,180" />
            <path d="M 320,100 C 330,150 340,180 340,210" />
            <path d="M 385,82 C 400,140 430,190 450,220" />
            <path d="M 250,250 C 300,260 380,260 480,260" />
          </g>

          <text
            x="325"
            y="235"
            textAnchor="middle"
            fill="rgba(16, 185, 129, 0.08)"
            className="font-black text-4xl tracking-[0.25em] select-none pointer-events-none"
          >
            JIGAWA STATE
          </text>

          {filteredLgas.map((lga) => {
            const isHovered = hoveredLga?.id === lga.id
            const isSelected = selectedLga?.id === lga.id
            const color = STATUS_STYLES[lga.status].dot

            return (
              <g
                key={lga.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredLga(lga)}
                onMouseLeave={() => setHoveredLga(null)}
                onClick={() => setSelectedLga(lga)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedLga(lga)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${lga.name} LGA, status ${lga.status}`}
              >
                {(isHovered || isSelected) && (
                  <circle
                    cx={lga.x}
                    cy={lga.y}
                    r="14"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                <circle
                  cx={lga.x}
                  cy={lga.y}
                  r={isHovered || isSelected ? 8 : 6}
                  fill={color}
                  stroke={isDark ? '#070D1E' : '#FFFFFF'}
                  strokeWidth="2"
                />

                <text
                  x={lga.x}
                  y={lga.y - 10}
                  textAnchor="middle"
                  className={`text-[9px] font-black tracking-tight select-none pointer-events-none ${
                    isHovered || isSelected
                      ? 'fill-white text-[11px]'
                      : 'fill-slate-300 opacity-85'
                  }`}
                >
                  {lga.name}
                </text>
              </g>
            )
          })}
        </svg>

        {currentDisplay && (
          <div className="absolute bottom-3 left-3 z-20 max-w-xs bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-slate-100">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        STATUS_STYLES[currentDisplay.status].dot,
                    }}
                  />
                  <h4 className="font-extrabold text-sm text-white">
                    {currentDisplay.name} LGA
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentDisplay.zone}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded border text-[9px] font-extrabold ${
                  STATUS_STYLES[currentDisplay.status].badge
                }`}
              >
                {currentDisplay.status.toUpperCase()}
              </span>
            </div>

            <div className="mt-2.5 space-y-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Activity className="w-3 h-3 text-slate-400" />
                <span>Operational status: {currentDisplay.status}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <AlertTriangle className="w-3 h-3 text-slate-400" />
                <span>Reported incidents: Not available</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-slate-400" />
                <span>Agent check-ins: Not available</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Last update: No recent data</span>
              </div>
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-slate-400">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>Click any LGA dot to inspect</span>
        </div>
      </div>

      <div
        className={`p-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${borderClass}`}
      >
        <span className="text-[10px] font-mono text-slate-400">
          27 LGAs · Illustrative map coordinates · Operational data pending
        </span>
        <Link
          href="/map"
          className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-400 hover:text-emerald-300 transition"
        >
          View Full Interactive Map
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}