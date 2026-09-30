import Link from "next/link";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import JigawaMap from "../components/JigawaMap";
import {
  Map,
  Users,
  ClipboardList,
  AlertTriangle,
  Vote,
  Landmark,
  Building2,
  MessageSquare,
  Radio,
  Bell,
  FileText,
  BarChart3,
  Settings,
  Activity,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from "lucide-react";

const electionSections = [
  {
    title: "Governorship",
    description: "Statewide governorship election monitoring",
    href: "/dashboard/governorship",
    icon: Landmark,
  },
  {
    title: "Senate",
    description: "Senatorial district election monitoring",
    href: "/dashboard/senatorial",
    icon: Building2,
  },
  {
    title: "House of Representatives",
    description: "Federal constituency monitoring",
    href: "/dashboard/house-of-reps",
    icon: Building2,
  },
  {
    title: "House of Assembly",
    description: "State constituency election monitoring",
    href: "/dashboard/state-assembly",
    icon: Landmark,
  },
];

const overviewCards = [
  {
    title: "Polling Units",
    description: "Registered polling units",
    href: "/polling-units",
    icon: ClipboardList,
  },
  {
    title: "Field Agents",
    description: "Assigned election field agents",
    href: "/agents",
    icon: Users,
  },
  {
    title: "Results Submitted",
    description: "Submitted polling-unit results",
    href: "/results",
    icon: Vote,
  },
  {
    title: "Reported Incidents",
    description: "Reported election incidents",
    href: "/incidents",
    icon: AlertTriangle,
  },
];

const quickLinks = [
  {
    title: "Interactive Map",
    description: "View polling units and locations",
    href: "/map",
    icon: Map,
  },
  {
    title: "Incident Tracker",
    description: "Review and manage reported incidents",
    href: "/incidents",
    icon: AlertTriangle,
  },
  {
    title: "Agents",
    description: "View field agents and assignments",
    href: "/agents",
    icon: Users,
  },
  {
    title: "Polling Units",
    description: "Browse polling-unit information",
    href: "/polling-units",
    icon: ClipboardList,
  },
  {
    title: "Results",
    description: "Review submitted election results",
    href: "/results",
    icon: Vote,
  },
  {
    title: "Collation",
    description: "Monitor result collation",
    href: "/collation",
    icon: BarChart3,
  },
  {
    title: "Election Results",
    description: "View election result summaries",
    href: "/election-results",
    icon: FileText,
  },
  {
    title: "Communication",
    description: "View messages and communication",
    href: "/communication",
    icon: MessageSquare,
  },
  {
    title: "Broadcast",
    description: "Send and manage broadcasts",
    href: "/broadcast",
    icon: Radio,
  },
  {
    title: "Notifications",
    description: "View system notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    description: "Manage dashboard settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Audit Logs",
    description: "Review system activity records",
    href: "/audit-logs",
    icon: Activity,
  },
];

function DashboardCard({ title, description, href, icon: Icon }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Icon size={21} />
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <ArrowUpRight
        size={18}
        className="text-gray-400 transition group-hover:text-blue-600"
      />
    </Link>
  );
}

function MetricCard({ title, description, href, icon: Icon }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Icon size={22} />
        </div>
        <ArrowUpRight
          size={18}
          className="text-gray-400 transition group-hover:text-blue-600"
        />
      </div>

      <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
        —
      </p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </Link>
  );
}

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header />

        <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6 lg:p-8">
          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                JIGAWA STATE PDP POLLWATCH
              </p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                Election Situation Room
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Central monitoring dashboard for election operations across
                Jigawa State.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Clock size={16} />
              Pre-election mode
            </div>
          </section>

          {/* Election dashboards */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Election Dashboards
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Open a dedicated dashboard for each election category.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {electionSections.map((section) => {
                const Icon = section.icon;

                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <Icon size={23} />
                      </div>
                      <ArrowUpRight
                        size={18}
                        className="text-gray-400 group-hover:text-blue-600"
                      />
                    </div>

                    <h3 className="mt-4 font-bold text-gray-900 dark:text-white">
                      {section.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {section.description}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-400">
                      Open dashboard →
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Operational overview */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Operational Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Key figures from the election monitoring system.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {overviewCards.map((card) => (
                <MetricCard key={card.href} {...card} />
              ))}
            </div>

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Figures will appear here when the dashboard is connected to the
              backend.
            </p>
          </section>

          {/* Map and operational status */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Geographic Monitoring
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View the state map and access the interactive map page.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 xl:col-span-2">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Jigawa State Map
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Interactive geographic overview
                    </p>
                  </div>

                  <Link
                    href="/map"
                    className="whitespace-nowrap text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
                  >
                    Open map →
                  </Link>
                </div>

                <div className="min-h-[300px]">
                  <JigawaMap />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  System Status
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Current monitoring readiness
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <Clock size={19} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Pre-election monitoring
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        The system is in pre-election mode.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <BarChart3 size={19} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Results monitoring
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Waiting for connected result data.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <Users size={19} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Agent monitoring
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Agent figures will appear after backend integration.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <ShieldCheck size={19} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Access control
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Dashboard access is managed by the system's
                        authentication and permissions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick access to system pages */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                System Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Quick access to the main monitoring and management sections.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((item) => (
                <DashboardCard key={item.href} {...item} />
              ))}
            </div>
          </section>

          {/* Backend integration notice */}
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
            <div className="flex items-start gap-3">
              <Activity
                size={20}
                className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-400"
              />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                  Backend integration pending
                </h3>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                  This dashboard currently provides navigation and a
                  structural overview. Live statistics, agent activity,
                  submitted results, and incident summaries will be displayed
                  after the backend integration is completed.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}