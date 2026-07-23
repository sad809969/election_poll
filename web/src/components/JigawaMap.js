import React from 'react'

export default function JigawaMap({ statusFilter = 'All' }) {
  // SVG Vector map representation of Jigawa State 27 LGAs with color-coded status pins
  const pins = [
    { id: 'dt', name: 'Dutse LGA', x: 260, y: 280, status: 'Normal', pu: 'PU 001-240' },
    { id: 'hd', name: 'Hadejia LGA', x: 420, y: 150, status: 'Normal', pu: 'PU 001-210' },
    { id: 'gm', name: 'Gumel LGA', x: 340, y: 110, status: 'Attention', pu: 'PU 078' },
    { id: 'kz', name: 'Kazaure LGA', x: 120, y: 120, status: 'Normal', pu: 'PU 056' },
    { id: 'rg', name: 'Ringim LGA', x: 190, y: 220, status: 'Normal', pu: 'PU 001-175' },
    { id: 'bk', name: 'Birnin Kudu LGA', x: 290, y: 340, status: 'Normal', pu: 'PU 001-225' },
    { id: 'bb', name: 'Babura LGA', x: 200, y: 80, status: 'Normal', pu: 'PU 001-190' },
    { id: 'jh', name: 'Jahun LGA', x: 310, y: 210, status: 'Critical', pu: 'PU 002' },
    { id: 'gr', name: 'Guri LGA', x: 460, y: 210, status: 'Attention', pu: 'PU 023' },
    { id: 'kg', name: 'Kaugama LGA', x: 380, y: 160, status: 'Normal', pu: 'PU 012' },
    { id: 'ky', name: 'Kiyawa LGA', x: 280, y: 240, status: 'Normal', pu: 'PU 001-170' },
    { id: 'gw', name: 'Gwaram LGA', x: 370, y: 350, status: 'Normal', pu: 'PU 001-215' },
    { id: 'st', name: 'Sule Tankarkar LGA', x: 280, y: 80, status: 'Normal', pu: 'PU 001-155' },
    { id: 'mg', name: 'Maigatari LGA', x: 300, y: 50, status: 'Normal', pu: 'PU 001-150' },
  ]

  const getPinColor = (status) => {
    switch(status) {
      case 'Normal': return '#10B981' // Green
      case 'Attention': return '#F59E0B' // Yellow
      case 'Critical': return '#EF4444' // Red
      case 'No Report': return '#94A3B8' // Slate
      default: return '#10B981'
    }
  }

  return (
    <div className="relative w-full h-[320px] bg-slate-950/60 rounded-xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden">
      {/* Top Map Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <span className="text-xs font-bold text-slate-300">Polling Units by Status</span>
          <p className="text-[10px] text-slate-500">Live geographic distribution across 27 LGAs</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px]">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-slate-300">Normal: 3,812</span></div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="text-slate-300">Attention: 685</span></div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-slate-300">Critical: 156</span></div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500"></span><span className="text-slate-300">No Report: 174</span></div>
        </div>
      </div>

      {/* SVG Map Render */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 550 400" className="w-full h-full stroke-emerald-600/40 fill-emerald-950/30">
          {/* Stylized Jigawa Boundary Path */}
          <path d="M 100,100 L 180,60 L 290,40 L 360,70 L 450,120 L 500,200 L 480,260 L 400,380 L 260,390 L 160,320 L 90,260 L 110,180 Z" strokeWidth="2" strokeDasharray="4 2" />
          {/* LGA Divisions */}
          <path d="M 180,60 L 200,200 L 160,320 M 290,40 L 280,240 L 260,390 M 360,70 L 340,210 L 400,380 M 450,120 L 380,260" strokeWidth="1" opacity="0.4" />
          {/* State Center Title Label */}
          <text x="275" y="210" textAnchor="middle" className="fill-emerald-500/20 font-black text-2xl tracking-widest pointer-events-none select-none">
            JIGAWA STATE
          </text>
        </svg>
      </div>

      {/* Map Pins Layer */}
      <div className="absolute inset-0 pointer-events-auto">
        <svg viewBox="0 0 550 400" className="w-full h-full">
          {pins.map((pin) => (
            <g key={pin.id} className="cursor-pointer group">
              {/* Outer Pulse */}
              {pin.status === 'Critical' && (
                <circle cx={pin.x} cy={pin.y} r="12" fill={getPinColor(pin.status)} opacity="0.3" className="animate-ping" />
              )}
              {/* Main Pin Dot */}
              <circle cx={pin.x} cy={pin.y} r="6" fill={getPinColor(pin.status)} stroke="#0F172A" strokeWidth="2" />
              {/* Pin Label on Hover */}
              <text x={pin.x} y={pin.y - 10} textAnchor="middle" className="fill-slate-200 text-[9px] font-bold opacity-80 group-hover:opacity-100 transition">
                {pin.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Map Footer Controls */}
      <div className="flex justify-between items-center z-10 pt-2 border-t border-slate-800/60">
        <span className="text-[10px] text-slate-400 font-mono">Map Projection: WGS84 | Jigawa State Grid</span>
        <button className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-[10px] font-semibold px-2.5 py-1 rounded-md transition">
          View Full Interactive Map ↗
        </button>
      </div>
    </div>
  )
}
