import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useTheme } from "./_app";
import { apiFetch } from "../lib/api";

import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export default function PollingUnitsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // ADD THIS
  const [pollingUnits, setPollingUnits] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);

  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("All");
  const [lgaFilter, setLgaFilter] = useState("All LGAs");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

const [formData, setFormData] = useState({
  lga_id: "",
  ward_id: "",
  code: "",
  name: "",
  registered_voters: "",
  latitude: "",
  longitude: "",
});

  useEffect(() => {
    console.log("Polling Units:", pollingUnits);
  }, [pollingUnits]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
  try {
    const [puRes, lgaRes, wardRes] = await Promise.all([
      apiFetch("/electoral/polling-units"),
      apiFetch("/electoral/lgas"),
      apiFetch("/electoral/wards"),
    ]);

    console.log("Polling Units API:", puRes);
    console.log("LGAs API:", lgaRes);
    console.log("Wards API:", wardRes);

    setPollingUnits(puRes);
    setLgas(lgaRes);
    setWards(wardRes);
  } catch (err) {
    console.error("API Error:", err);
  } finally {
    setLoading(false);
  }
}

async function createPollingUnit(e) {
  e.preventDefault();

  try {
    await apiFetch("/electoral/polling-units", {
      method: "POST",
      body: JSON.stringify({
        ...formData,
        lga_id: Number(formData.lga_id),
        ward_id: Number(formData.ward_id),
        registered_voters: Number(formData.registered_voters),
        latitude:
          formData.latitude === ""
            ? null
            : Number(formData.latitude),
        longitude:
          formData.longitude === ""
            ? null
            : Number(formData.longitude),
      }),
    });

    setShowModal(false);

    setFormData({
      lga_id: "",
      ward_id: "",
      code: "",
      name: "",
      registered_voters: "",
      latitude: "",
      longitude: "",
    });

    loadData();

  } catch (err) {
    alert(err.message);
  }
}

  const filteredPus = pollingUnits.filter((pu) => {
    const ward = wards.find((w) => w.id === pu.ward_id);
    const lga = lgas.find((l) => l.id === pu.lga_id);

    const matchesStatus =
      statusFilter === "All" || pu.status === statusFilter;

    const matchesLga =
      lgaFilter === "All LGAs" ||
      (lga && lga.name === lgaFilter);

    const matchesSearch =
      pu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pu.code.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesLga && matchesSearch;
  });

  const normalCount = pollingUnits.filter(
    (p) => p.status === "Normal"
  ).length;

  const attentionCount = pollingUnits.filter(
    (p) => p.status === "Attention"
  ).length;

  const criticalCount = pollingUnits.filter(
    (p) => p.status === "Critical"
  ).length;

  const cardClass = isDark
    ? "bg-[#141E38] border border-slate-800"
    : "bg-white border border-slate-200 shadow-sm";

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070D1E] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title="Polling Units Directory" 
          subtitle="Electoral boundary management across all 4,827 Polling Units in Jigawa State" 
        />

        <main className="p-6 space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${cardClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-slate-400">Total Polling Units</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{pollingUnits.length}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">27 LGAs • 287 Wards</p>
              </div>
              <div className="p-3 rounded-xl bg-pdp/20 text-pdp"><Building2 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-emerald-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-emerald-500">Normal Health Status</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{normalCount}</h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">79.0% operating smoothly</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-amber-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-amber-500">Attention Required</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{attentionCount}</h3>
                <p className="text-[10px] text-amber-500 mt-0.5">14.2% crowding or BVAS delay</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500"><AlertTriangle className="w-6 h-6" /></div>
            </div>

            <div className={`${cardClass} border-red-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-bold text-red-500">Critical Incidents</span>
                <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{criticalCount}</h3>
                <p className="text-[10px] text-red-500 mt-0.5">3.2% high risk units</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/20 text-red-500"><AlertTriangle className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={`${cardClass} rounded-xl p-4 flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {['All', 'Normal', 'Attention', 'Critical'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === st 
                      ? 'bg-pdp text-white shadow-md' 
                      : isDark ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <select 
                value={lgaFilter}
                onChange={(e) => setLgaFilter(e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="All LGAs">All LGAs</option>

                {lgas.map((lga) => (
                 <option key={lga.id} value={lga.name}>
                   {lga.name}
                 </option>
                 ))}
              </select>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search unit code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Polling Units Table */}
          <div className={`${cardClass} rounded-xl p-5 shadow-sm space-y-4`}>
            <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Polling Unit Master Directory</h3>
              <span className="text-xs font-mono text-slate-400">Showing {filteredPus.length} Units</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-y text-slate-500 font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <th className="py-3 px-3">PU Code</th>
                    <th className="py-3 px-3">Polling Unit Name</th>
                    <th className="py-3 px-3">Ward</th>
                    <th className="py-3 px-3">LGA</th>
                    <th className="py-3 px-3">Registered Voters</th>
                    <th className="py-3 px-3">Assigned Agent</th>
                    <th className="py-3 px-3">Health Status</th>
                    <th className="py-3 px-3 text-right">Result Progress</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                  {filteredPus.map((pu) => (
                    <tr key={pu.id} className={`transition ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                      <td className="py-3 px-3 font-mono font-extrabold text-pdp">{pu.code}</td>
                      <td className={`py-3 px-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pu.name}</td>
                      <td className="py-3 px-3 text-slate-500">
                      {wards.find((w) => w.id === pu.ward_id)?.name || "-"}
                       </td>
                      <td className="py-3 px-3 text-slate-400">
                      {lgas.find((l) => l.id === pu.lga_id)?.name || "-"}
                      </td>
                      <td className={`py-3 px-3 font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                       {pu.registered_voters} Voters
                     </td>
                      <td className="py-3 px-3 text-slate-500">
                       <span>Not Assigned</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pu.status === 'Critical' ? 'bg-red-500/20 text-red-500'
                            : pu.status === 'Attention' ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-emerald-500/20 text-emerald-500'
                        }`}>
                          {pu.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                        Pending
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
