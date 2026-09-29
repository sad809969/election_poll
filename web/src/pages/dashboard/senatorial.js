import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import JigawaMap from "../../components/JigawaMap";
import { useTheme } from "../_app";
import {
  MapPin,
  Users,
  Vote,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  Clock3,
  Radio,
  Building2,
  ChevronRight,
  BarChart3,
  Landmark,
  Map,
} from "lucide-react";

const districts = [
  {
    id: "north-west",
    name: "Jigawa North-West",
    shortName: "North-West",
  },
  {
    id: "north-east",
    name: "Jigawa North-East",
    shortName: "North-East",
  },
  {
    id: "central",
    name: "Jigawa Central",
    shortName: "Central",
  },
];

const overviewCards = [
  {
    title: "Polling Units",
    description: "View polling units in the selected district",
    icon: MapPin,
    href: "/polling-units",
  },
  {
    title: "Field Agents",
    description: "Monitor agents and their assignments",
    icon: Users,
    href: "/agents",
  },
  {
    title: "Election Results",
    description: "View submitted Senate election results",
    icon: Vote,
    href: "/election-results",
  },
  {
    title: "Incident Tracker",
    description: "Monitor reported election incidents",
    icon: AlertTriangle,
    href: "/incidents",
  },
  {
    title: "Communication",
    description: "View election operation messages",
    icon: MessageSquare,
    href: "/communication",
  },
  {
    title: "Results Dashboard",
    description: "Monitor results submission progress",
    icon: BarChart3,
    href: "/results",
  },
];

const statusItems = [
  "District election monitoring",
  "LGA and ward records",
  "Polling unit records",
  "Field agent activity",
  "Result submissions",
  "Incident reports",
];

export default function SenatorialDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [selectedDistrict, setSelectedDistrict] = useState(
    districts[0]
  );

  const cardClass = isDark
    ? "bg-gray-900 border-gray-800 text-gray-100"
    : "bg-white border-gray-200 text-gray-900";

  const mutedText = isDark
    ? "text-gray-400"
    : "text-gray-500";

  const selectedButtonClass = isDark
    ? "bg-green-900/40 border-green-500 text-green-300"
    : "bg-green-50 border-green-600 text-green-800";

  return (
    <div
      className={`min-h-screen flex ${
        isDark
          ? "bg-gray-950 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <Sidebar />

      <main className="flex-1 min-w-0">
        <Header
          title="Senate Dashboard"
          subtitle="Jigawa State Senatorial District Monitoring"
        />

        <div className="p-4 md:p-6 space-y-6">
          {/* Page heading */}
          <section
            className={`rounded-2xl border p-5 md:p-6 ${cardClass}`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-lg bg-green-100 p-2 text-green-700">
                    <Landmark size={22} />
                  </span>

                  <span className="text-sm font-semibold text-green-600">
                    JIGAWA STATE PDP POLLWATCH
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold">
                  Senate Election Dashboard
                </h1>

                <p className={`mt-1 text-sm ${mutedText}`}>
                  Monitor senatorial election operations across
                  Jigawa State.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
                <Clock3 size={18} />
                <div>
                  <p className="text-sm font-semibold">
                    Pre-election mode
                  </p>
                  <p className="text-xs">
                    Live election data not available
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* District selector */}
          <section className={`rounded-2xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2 mb-2">
              <Map size={21} className="text-green-600" />
              <h2 className="text-lg font-bold">
                Select Senatorial District
              </h2>
            </div>

            <p className={`text-sm mb-4 ${mutedText}`}>
              Select a district to view its election monitoring
              dashboard.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {districts.map((district) => {
                const isSelected =
                  selectedDistrict.id === district.id;

                return (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => setSelectedDistrict(district)}
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? selectedButtonClass
                        : isDark
                        ? "border-gray-700 hover:border-green-500"
                        : "border-gray-200 hover:border-green-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {district.name}
                      </span>

                      {isSelected && (
                        <span className="rounded-full bg-green-600 px-2 py-1 text-xs text-white">
                          Selected
                        </span>
                      )}
                    </div>

                    <p className={`mt-2 text-xs ${mutedText}`}>
                      Open district overview
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Selected district */}
          <section className={`rounded-2xl border p-5 ${cardClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="rounded-xl bg-green-100 p-3 text-green-700">
                <Building2 size={24} />
              </span>

              <div>
                <p className={`text-xs uppercase tracking-wide ${mutedText}`}>
                  Selected monitoring area
                </p>

                <h2 className="text-xl font-bold">
                  {selectedDistrict.name}
                </h2>

                <p className={`mt-1 text-sm ${mutedText}`}>
                  District-level view of LGAs, wards, polling units,
                  agents, results, and incidents.
                </p>
              </div>
            </div>
          </section>

          {/* District overview */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">
                {selectedDistrict.shortName} operational overview
              </h2>

              <p className={`text-sm ${mutedText}`}>
                Verified figures for this district will appear
                when the backend is connected.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: "LGAs", icon: Building2 },
                { label: "Wards", icon: Map },
                { label: "Polling Units", icon: MapPin },
                { label: "Field Agents", icon: Users },
                { label: "Results Submitted", icon: Vote },
                { label: "Incidents", icon: AlertTriangle },
                { label: "Registered Voters", icon: Users },
                { label: "Pending Reports", icon: Clock3 },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`rounded-2xl border p-5 ${cardClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${mutedText}`}>
                        {item.label}
                      </span>

                      <Icon size={21} className="text-green-600" />
                    </div>

                    <p className="mt-3 text-2xl font-bold">—</p>

                    <p className={`mt-1 text-xs ${mutedText}`}>
                      Awaiting verified data
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Monitoring pages */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">
                District monitoring areas
              </h2>

              <p className={`text-sm ${mutedText}`}>
                Open an operational page to view relevant information.
                District filtering will be connected to the backend later.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {overviewCards.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className={`flex items-center gap-4 rounded-2xl border p-5 transition hover:border-green-500 ${cardClass}`}
                  >
                    <span
                      className={`rounded-xl p-3 ${
                        isDark
                          ? "bg-gray-800 text-green-400"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      <Icon size={22} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">
                        {item.title}
                      </h3>

                      <p className={`mt-1 text-xs ${mutedText}`}>
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight
                      size={18}
                      className={mutedText}
                    />
                  </a>
                );
              })}
            </div>
          </section>

          {/* Map and status */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div
              className={`xl:col-span-2 rounded-2xl border p-4 md:p-5 ${cardClass}`}
            >
              <div className="mb-4">
                <h2 className="text-lg font-bold">
                  {selectedDistrict.name} monitoring map
                </h2>

                <p className={`mt-1 text-sm ${mutedText}`}>
                  The map will display district-specific monitoring
                  information after backend integration.
                </p>
              </div>

              <JigawaMap />
            </div>

            <div className={`rounded-2xl border p-5 ${cardClass}`}>
              <div className="flex items-center gap-2">
                <Radio size={20} className="text-green-600" />

                <h2 className="text-lg font-bold">
                  District situation status
                </h2>
              </div>

              <p className={`mt-2 text-sm ${mutedText}`}>
                Monitoring status for {selectedDistrict.name}.
                Live figures will appear when verified data is connected.
              </p>

              <div className="mt-5 space-y-3">
                {statusItems.map((label) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between gap-3 border-b pb-3 ${
                      isDark
                        ? "border-gray-800"
                        : "border-gray-100"
                    }`}
                  >
                    <span className="text-sm">{label}</span>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <p className={`text-center text-xs ${mutedText}`}>
            District information will be displayed from connected
            and verified system records. No live results or
            incident totals are fabricated.
          </p>
        </div>
      </main>
    </div>
  );
}