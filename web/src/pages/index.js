import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import JigawaMap from "../components/JigawaMap";
import { useTheme } from "./_app";
import {
  Vote,
  Users,
  MapPin,
  AlertTriangle,
  FileText,
  Building2,
  Landmark,
  House,
  ChevronRight,
  Radio,
  ShieldCheck,
  Clock3,
} from "lucide-react";

const electionSections = [
  {
    id: "governorship",
    title: "Governorship",
    description: "Statewide governorship election monitoring",
    icon: Building2,
  },
  {
    id: "senate",
    title: "Senate",
    description: "Senatorial district election monitoring",
    icon: Building2,
  },
  {
    id: "house-of-representatives",
    title: "House of Representatives",
    description: "Federal constituency election monitoring",
    icon: Building2,
  },
  {
    id: "house-of-assembly",
    title: "House of Assembly",
    description: "State constituency election monitoring",
    icon: FileText,
  },
];

const overviewCards = [
  {
    title: "Polling Units",
    description: "Registered polling units",
    icon: MapPin,
    href: "/polling-units",
  },
  {
    title: "Field Agents",
    description: "Agent management and assignments",
    icon: Users,
    href: "/agents",
  },
  {
    title: "Results",
    description: "Submitted election results",
    icon: Vote,
    href: "/results",
  },
  {
    title: "Incidents",
    description: "Reported election incidents",
    icon: AlertTriangle,
    href: "/incidents",
  },
];

export default function Dashboard() {
  const { theme } = useTheme();
  const [selectedElection, setSelectedElection] = useState("governorship");

  const isDark = theme === "dark";

  const cardClass = isDark
    ? "bg-gray-900 border-gray-800 text-gray-100"
    : "bg-white border-gray-200 text-gray-900";

  const mutedText = isDark ? "text-gray-400" : "text-gray-500";

  const selectedSection = electionSections.find(
    (section) => section.id === selectedElection
  );

  return (
    <div
      className={`min-h-screen flex ${
        isDark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Sidebar />

      <main className="flex-1 min-w-0">
        <Header
          title="Dashboard"
          subtitle="Election monitoring and situation room overview"
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
                    <ShieldCheck size={22} />
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    JIGAWA STATE PDP POLLWATCH
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold">
                  Election Situation Room
                </h1>

                <p className={`mt-1 text-sm ${mutedText}`}>
                  Central monitoring workspace for election operations.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
                <Clock3 size={18} />
                <div>
                  <p className="text-sm font-semibold">Pre-election mode</p>
                  <p className="text-xs">Live election data not available</p>
                </div>
              </div>
            </div>
          </section>

          {/* Election selector */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">Election workspaces</h2>
              <p className={`text-sm ${mutedText}`}>
                Select an election to open its monitoring workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {electionSections.map((section) => {
                const Icon = section.icon;
                const selected = selectedElection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setSelectedElection(section.id)}
                    className={`text-left rounded-2xl border p-5 transition-all ${
                      selected
                        ? "border-green-600 bg-green-50 ring-2 ring-green-500/20"
                        : `${cardClass} hover:border-green-500`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`rounded-xl p-3 ${
                          selected
                            ? "bg-green-600 text-white"
                            : isDark
                            ? "bg-gray-800 text-gray-300"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Icon size={23} />
                      </span>

                      <ChevronRight
                        size={19}
                        className={
                          selected ? "text-green-700" : mutedText
                        }
                      />
                    </div>

                    <h3
                      className={`mt-4 font-bold ${
                        selected ? "text-green-800" : ""
                      }`}
                    >
                      {section.title}
                    </h3>

                    <p
                      className={`mt-1 text-sm ${
                        selected ? "text-green-700" : mutedText
                      }`}
                    >
                      {section.description}
                    </p>

                    {selected && (
                      <span className="mt-3 inline-block text-xs font-semibold text-green-700">
                        Selected workspace
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Selected election information */}
          <section className={`rounded-2xl border p-5 ${cardClass}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`text-xs uppercase tracking-wide ${mutedText}`}>
                  Current workspace
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {selectedSection?.title}
                </h2>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  {selectedSection?.description}
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                <Clock3 size={14} />
                Awaiting election data
              </span>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className={`text-sm ${mutedText}`}>
                This workspace is selected locally. Connecting election-specific
                results, polling units, incidents, and assignments to the backend
                will be done in a later step.
              </p>
            </div>
          </section>

          {/* Operational overview */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">Operational overview</h2>
              <p className={`text-sm ${mutedText}`}>
                Access the main monitoring areas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className={`mt-1 text-xs ${mutedText}`}>
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight size={18} className={mutedText} />
                  </a>
                );
              })}
            </div>
          </section>

          {/* Map and status */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className={`xl:col-span-2 rounded-2xl border p-4 md:p-5 ${cardClass}`}>
              <div className="mb-4">
                <h2 className="text-lg font-bold">Jigawa State monitoring map</h2>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  Select an LGA to view its current data availability.
                </p>
              </div>

              <JigawaMap />
            </div>

            <div className={`rounded-2xl border p-5 ${cardClass}`}>
              <div className="flex items-center gap-2">
                <Radio size={20} className="text-green-600" />
                <h2 className="text-lg font-bold">Situation room status</h2>
              </div>

              <p className={`mt-2 text-sm ${mutedText}`}>
                The dashboard is in pre-election mode. Operational figures will
                appear when verified data is connected.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Election workspace",
                  "Polling unit records",
                  "Agent activity",
                  "Result submissions",
                  "Incident reports",
                ].map((label) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between gap-3 border-b pb-3 ${
                      isDark ? "border-gray-800" : "border-gray-100"
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

          {/* Footer note */}
          <p className={`text-center text-xs ${mutedText}`}>
            Election information will be displayed from connected system records.
            No live results or incident totals are shown until available.
          </p>
        </div>
      </main>
    </div>
  );
}