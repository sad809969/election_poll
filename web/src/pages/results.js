import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  BarChart3, 
  CheckCircle, 
  Building2, 
  Trophy, 
  Clock, 
  AlertCircle, 
  FileSpreadsheet, 
  FileText, 
  Archive,
  Download,
  Image as ImageIcon,
  CheckCheck
} from 'lucide-react'
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

export default function ResultsDashboard() {
  const partyShare = [
    { name: 'PDP', votes: '562,430', pct: 45.1, color: '#008751' },
    { name: 'APC', votes: '418,765', pct: 33.6, color: '#1E40AF' },
    { name: 'NNPP', votes: '153,890', pct: 12.3, color: '#7C3AED' },
    { name: 'LP', votes: '72,341', pct: 5.8, color: '#EAB308' },
    { name: 'Others', votes: '41,167', pct: 3.2, color: '#64748B' },
  ]

  const lgaResults = [
    { lga: 'Dutse', pdp: '78,654', apc: '55,430', nnpp: '21,600', lp: '8,620', others: '4,300', valid: '168,604', pct: 95 },
    { lga: 'Hadejia', pdp: '65,432', apc: '48,721', nnpp: '18,340', lp: '7,100', others: '3,210', valid: '142,803', pct: 90 },
    { lga: 'Kazaure', pdp: '62,112', apc: '44,875', nnpp: '16,922', lp: '6,420', others: '2,988', valid: '133,317', pct: 88 },
    { lga: 'Gumel', pdp: '54,331', apc: '43,210', nnpp: '15,443', lp: '5,310', others: '2,450', valid: '120,744', pct: 85 },
    { lga: 'Kiyawa', pdp: '48,231', apc: '36,543', nnpp: '14,200', lp: '4,800', others: '2,112', valid: '105,886', pct: 82 },
  ]

  const recentPuResults = [
    { pu: 'PU 023', ward: 'Guri Ward A', lga: 'Guri LGA', pdp: 245, apc: 198, nnpp: 76, lp: 34, others: 12, valid: 565, status: 'Completed', time: '10:45 AM' },
    { pu: 'PU 078', ward: 'Gumel Central', lga: 'Gumel LGA', pdp: 233, apc: 176, nnpp: 54, lp: 28, others: 9, valid: 500, status: 'Completed', time: '10:42 AM' },
    { pu: 'PU 105', ward: 'Hadejia Ward B', lga: 'Hadejia LGA', pdp: 198, apc: 154, nnpp: 61, lp: 23, others: 8, valid: 444, status: 'Completed', time: '10:38 AM' },
    { pu: 'PU 002', ward: 'Jahun Ward A', lga: 'Jahun LGA', pdp: 187, apc: 143, nnpp: 59, lp: 21, others: 7, valid: 417, status: 'Completed', time: '10:35 AM' },
    { pu: 'PU 056', ward: 'Kazaure Ward C', lga: 'Kazaure LGA', pdp: 176, apc: 132, nnpp: 47, lp: 18, others: 6, valid: 379, status: 'Completed', time: '10:30 AM' },
  ]

  const trendData = [
    { time: '12PM', received: 1200 },
    { time: '3PM', received: 2100 },
    { time: '6PM', received: 3100 },
    { time: '9PM', received: 3500 },
    { time: '12AM', received: 3750 },
    { time: '3AM', received: 3850 },
    { time: '6AM', received: 3912 },
  ]

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar theme="light" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Results Dashboard" 
          subtitle="Real-time results from polling units across Jigawa State" 
          theme="light" 
        />

        <main className="p-6 space-y-6">
          {/* Top Filter Bar */}
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Filter View:</span>
              <select className="border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-700 outline-none">
                <option>Governorship Election 2027</option>
              </select>
              <select className="border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-700 outline-none">
                <option>State Level</option>
                <option>LGA Level</option>
              </select>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Last Updated: <strong>20 Apr 2027, 10:46 AM</strong>
            </div>
          </div>

          {/* 5 Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Total Polling Units</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-pdp"><Building2 className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-slate-900">4,827</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Across 27 LGAs</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Results Received</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><CheckCircle className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-slate-900">3,912 <span className="text-xs font-bold text-blue-600">(81.1%)</span></h3>
                <p className="text-[10px] text-slate-400 mt-0.5">From 27 LGAs</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Total Valid Votes</span>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><FileText className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-slate-900">1,248,593</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Today, 20 Apr 2027</p>
              </div>
            </div>

            <div className="bg-emerald-500 text-white border border-emerald-600 rounded-xl p-4 shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold opacity-90">Leading Party</span>
                <div className="p-2 rounded-lg bg-white/20 text-white"><Trophy className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-black">PDP</h3>
                <p className="text-[11px] font-bold opacity-90 mt-0.5">562,430 (45.1%)</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Pending Results</span>
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600"><Clock className="w-4 h-4" /></div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-slate-900">915 <span className="text-xs font-bold text-rose-500">(18.9%)</span></h3>
                <p className="text-[10px] text-slate-400 mt-0.5">From 12 LGAs</p>
              </div>
            </div>
          </div>

          {/* Row 1: Party Summary Donut + Results by LGA Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Party Donut Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">Results Summary by Party (State Level)</h3>
              <div className="h-[180px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={partyShare} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="pct">
                      {partyShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute text-center leading-tight">
                  <span className="text-xs font-bold text-slate-400 block">Total Valid</span>
                  <span className="text-sm font-black text-slate-900">1,248,593</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {partyShare.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></span>
                      <span className="font-bold text-slate-800">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{p.votes}</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-1">({p.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Results by LGA Table */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900">Results by LGA</h3>
                <button className="text-[10px] font-bold text-pdp hover:underline">View Full Report</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold">
                      <th className="py-2.5 px-3">LGA</th>
                      <th className="py-2.5 px-3 text-pdp font-extrabold">PDP</th>
                      <th className="py-2.5 px-3 text-blue-700">APC</th>
                      <th className="py-2.5 px-3 text-purple-700">NNPP</th>
                      <th className="py-2.5 px-3 text-amber-700">LP</th>
                      <th className="py-2.5 px-3">Others</th>
                      <th className="py-2.5 px-3">Total Valid Votes</th>
                      <th className="py-2.5 px-3">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {lgaResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{r.lga}</td>
                        <td className="py-2.5 px-3 font-extrabold text-pdp">{r.pdp}</td>
                        <td className="py-2.5 px-3 text-blue-700 font-semibold">{r.apc}</td>
                        <td className="py-2.5 px-3 text-purple-700">{r.nnpp}</td>
                        <td className="py-2.5 px-3 text-amber-700">{r.lp}</td>
                        <td className="py-2.5 px-3 text-slate-500">{r.others}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{r.valid}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-700">{r.pct}%</span>
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-pdp h-full rounded-full" style={{ width: `${r.pct}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                      <td className="py-2.5 px-3">Total</td>
                      <td className="py-2.5 px-3 text-pdp">562,430</td>
                      <td className="py-2.5 px-3 text-blue-700">418,765</td>
                      <td className="py-2.5 px-3 text-purple-700">153,890</td>
                      <td className="py-2.5 px-3 text-amber-700">72,341</td>
                      <td className="py-2.5 px-3 text-slate-600">41,167</td>
                      <td className="py-2.5 px-3">1,248,593</td>
                      <td className="py-2.5 px-3">81.1%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Row 2: Recent Polling Unit Results Stream */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900">Polling Unit Results (Recent)</h3>
              <button className="text-[10px] font-bold text-pdp hover:underline">View All Results</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold">
                    <th className="py-2 px-3">Polling Unit</th>
                    <th className="py-2 px-3">Ward</th>
                    <th className="py-2 px-3">LGA</th>
                    <th className="py-2 px-3 text-pdp font-bold">PDP</th>
                    <th className="py-2 px-3 text-blue-700 font-bold">APC</th>
                    <th className="py-2 px-3 text-purple-700 font-bold">NNPP</th>
                    <th className="py-2 px-3 text-amber-700 font-bold">LP</th>
                    <th className="py-2 px-3">Others</th>
                    <th className="py-2 px-3 font-bold">Total Valid</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Reported At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentPuResults.map((pu, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{pu.pu}</td>
                      <td className="py-2.5 px-3 text-slate-600">{pu.ward}</td>
                      <td className="py-2.5 px-3 text-slate-600">{pu.lga}</td>
                      <td className="py-2.5 px-3 font-extrabold text-pdp">{pu.pdp}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-700">{pu.apc}</td>
                      <td className="py-2.5 px-3 text-purple-700">{pu.nnpp}</td>
                      <td className="py-2.5 px-3 text-amber-700">{pu.lp}</td>
                      <td className="py-2.5 px-3 text-slate-500">{pu.others}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{pu.valid}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {pu.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">{pu.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Verification + Note + Download Center */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5">Results Verification</h4>
              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> With Result Sheet Photo
                  </span>
                  <span className="font-bold text-slate-900">3,765 (76.5%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Without Result Sheet Photo
                  </span>
                  <span className="font-bold text-amber-700">147 (3.0%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Pending Verification
                  </span>
                  <span className="font-bold text-slate-700">1,062 (21.5%)</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Important Note
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Results are displayed as reported by authorized PDP agents from the field across Jigawa State.
              </p>
              <p className="text-xs font-bold text-amber-900">
                These are NOT official INEC results.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5">Download Center</h4>
              <div className="space-y-1.5 text-xs pt-1">
                <button className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition font-bold text-slate-700">
                  <span className="flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Download State Results (Excel)</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition font-bold text-slate-700">
                  <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-rose-600" /> Download State Results (PDF)</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
