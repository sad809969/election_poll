import { useRouter } from 'next/router'
import ResultsDashboardPage from '../results'
import { getCurrentUser } from '../../lib/api'
import { candidateContest, contestBySlug } from '../../lib/access'

/**
 * Per-contest election dashboard, e.g. /dashboard/governorship or
 * /dashboard/house-of-reps. Access is enforced by the route guard in _app.js.
 * Candidates see only their own contest; state-level roles can switch.
 */
export default function ContestDashboardPage() {
  const router = useRouter()
  const contest = contestBySlug(router.query.contest)

  if (!router.isReady) return null
  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070D1E] text-slate-300 text-sm">
        Unknown election dashboard.
      </div>
    )
  }

  const locked = candidateContest(getCurrentUser())?.id === contest.id

  return (
    <ResultsDashboardPage
      key={contest.id}
      contest={contest.id}
      lockedContest={locked}
      title={contest.title}
    />
  )
}
