// Pure prediction engine for the period domain (tech spec §6). No I/O, no React —
// it takes period rows and "today" and returns everything the dashboard, calendar,
// and insights screens need. Lives under lib/domains/period/ so the shared Calendar
// stays domain-agnostic (architecture constraint #2/#4).

export type PeriodStatus =
  | "insufficient_data"
  | "on_track"
  | "running_late"
  | "significant_delay"
  | "possible_skip";

export type PeriodForInsights = {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string | null; // 'YYYY-MM-DD'; null is treated as a single-day period
};

export type PredictionResult = {
  periodsLogged: number;
  avgCycleLength: number | null; // null until at least 2 periods exist
  avgPeriodDuration: number | null; // null until at least 1 period exists
  mostRecentStart: string | null;
  currentCycleDay: number | null; // 1-based: the most recent start is day 1
  predictedNextStart: string | null;
  predictedRangeEnd: string | null;
  daysUntilPredicted: number | null; // positive = in the future
  daysSincePredicted: number | null; // positive = overdue
  status: PeriodStatus;
};

// Rolling window for both averages (tech spec §6.2; open decision #2 keeps it at 6).
const ROLLING_WINDOW = 6;
const MS_PER_DAY = 86_400_000;
// Delay thresholds (tech spec §6.3; open decision #3).
const RUNNING_LATE_DAYS = 5;
const SIGNIFICANT_DELAY_DAYS = 14;

function toUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// Whole-day difference (toISO − fromISO). Computed in UTC so DST never shifts a count.
function diffDays(fromISO: string, toISO: string): number {
  return Math.round((toUTC(toISO) - toUTC(fromISO)) / MS_PER_DAY);
}

function addDays(iso: string, days: number): string {
  const d = new Date(toUTC(iso) + days * MS_PER_DAY);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function roundedAverage(nums: number[]): number {
  return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
}

export function computePeriodInsights(
  periods: PeriodForInsights[],
  todayISO: string,
): PredictionResult {
  const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const periodsLogged = sorted.length;

  const base: PredictionResult = {
    periodsLogged,
    avgCycleLength: null,
    avgPeriodDuration: null,
    mostRecentStart: null,
    currentCycleDay: null,
    predictedNextStart: null,
    predictedRangeEnd: null,
    daysUntilPredicted: null,
    daysSincePredicted: null,
    status: "insufficient_data",
  };

  if (periodsLogged === 0) return base;

  const mostRecentStart = sorted[sorted.length - 1].startDate;
  const currentCycleDay = diffDays(mostRecentStart, todayISO) + 1;

  // Average duration is meaningful from the first period; null end = single day.
  const recentDurations = sorted
    .slice(-ROLLING_WINDOW)
    .map((p) => (p.endDate ? diffDays(p.startDate, p.endDate) + 1 : 1));
  const avgPeriodDuration = roundedAverage(recentDurations);

  // Need two periods before any cycle length / prediction exists.
  if (periodsLogged < 2) {
    return { ...base, avgPeriodDuration, mostRecentStart, currentCycleDay };
  }

  const cycleLengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    cycleLengths.push(diffDays(sorted[i - 1].startDate, sorted[i].startDate));
  }
  const avgCycleLength = roundedAverage(cycleLengths.slice(-ROLLING_WINDOW));

  const predictedNextStart = addDays(mostRecentStart, avgCycleLength);
  const predictedRangeEnd = addDays(predictedNextStart, Math.max(avgPeriodDuration - 1, 0));
  const daysSincePredicted = diffDays(predictedNextStart, todayISO);

  return {
    periodsLogged,
    avgCycleLength,
    avgPeriodDuration,
    mostRecentStart,
    currentCycleDay,
    predictedNextStart,
    predictedRangeEnd,
    daysUntilPredicted: -daysSincePredicted,
    daysSincePredicted,
    status: classify(daysSincePredicted, avgCycleLength),
  };
}

function classify(daysSincePredicted: number, avgCycleLength: number): PeriodStatus {
  // A whole extra cycle has elapsed past the prediction with nothing logged. Checked
  // first because for typical cycle lengths it also satisfies the significant-delay test.
  if (daysSincePredicted >= avgCycleLength) return "possible_skip";
  if (daysSincePredicted >= SIGNIFICANT_DELAY_DAYS) return "significant_delay";
  if (daysSincePredicted >= RUNNING_LATE_DAYS) return "running_late";
  return "on_track"; // ≤ 4 days late, or still in the future
}
