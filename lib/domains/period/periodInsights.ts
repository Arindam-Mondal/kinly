// Pure prediction engine for the period domain (tech spec §6). No I/O, no React —
// it takes period rows and "today" and returns everything the dashboard, calendar,
// and insights screens need. Lives under lib/domains/period/ so the shared Calendar
// stays domain-agnostic (architecture constraint #2/#4).

import { formatMonthShort } from "@/components/calendar/calendarUtils";

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

// --- Shared series builders: the single source of the cycle/duration arithmetic, used by
// both the dashboard scalars (computePeriodInsights) and the Insights trends
// (computePeriodTrends) so the two can never drift apart. Inputs must be pre-sorted ascending. ---

// Days between each consecutive pair of period starts (one fewer entry than periods).
function cycleLengthsOf(sorted: PeriodForInsights[]): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    lengths.push(diffDays(sorted[i - 1].startDate, sorted[i].startDate));
  }
  return lengths;
}

// (end − start + 1) per period; a null end date counts as a single day.
function durationsOf(sorted: PeriodForInsights[]): number[] {
  return sorted.map((p) => (p.endDate ? diffDays(p.startDate, p.endDate) + 1 : 1));
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
  const avgPeriodDuration = roundedAverage(durationsOf(sorted).slice(-ROLLING_WINDOW));

  // Need two periods before any cycle length / prediction exists.
  if (periodsLogged < 2) {
    return { ...base, avgPeriodDuration, mostRecentStart, currentCycleDay };
  }

  const avgCycleLength = roundedAverage(cycleLengthsOf(sorted).slice(-ROLLING_WINDOW));

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

// How many points each Insights trend chart shows (tech spec §5.6: "last 6–12"). The
// average lines still use the rolling-6 window above, so they match the dashboard exactly.
const CHART_WINDOW = 12;

export type TrendPoint = { label: string; value: number };

export type PeriodTrends = {
  cycles: TrendPoint[]; // last ≤12 cycle lengths, labelled by the period that closes the cycle
  durations: TrendPoint[]; // last ≤12 period durations, labelled by each period's start
  avgCycleLength: number | null; // rolling-6 average (== dashboard)
  avgPeriodDuration: number | null; // rolling-6 average (== dashboard)
  shortestCycle: number | null; // over all recorded cycles
  longestCycle: number | null;
  totalCycles: number; // count of logged periods
};

// Derived series + stats for the Insights screen. Pure, no I/O. Reuses the same
// cycle/duration arithmetic as computePeriodInsights via the shared builders above so the
// numbers shown on Insights and Home can never disagree (tech spec §5.6).
export function computePeriodTrends(periods: PeriodForInsights[]): PeriodTrends {
  const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const totalCycles = sorted.length;

  const allCycleLengths = cycleLengthsOf(sorted);
  const allDurations = durationsOf(sorted);

  // Each cycle length sits between two periods; label it with the later period's start.
  const cycles: TrendPoint[] = allCycleLengths
    .map((value, i) => ({ label: formatMonthShort(sorted[i + 1].startDate), value }))
    .slice(-CHART_WINDOW);
  const durations: TrendPoint[] = allDurations
    .map((value, i) => ({ label: formatMonthShort(sorted[i].startDate), value }))
    .slice(-CHART_WINDOW);

  return {
    cycles,
    durations,
    avgCycleLength: allCycleLengths.length
      ? roundedAverage(allCycleLengths.slice(-ROLLING_WINDOW))
      : null,
    avgPeriodDuration: allDurations.length
      ? roundedAverage(allDurations.slice(-ROLLING_WINDOW))
      : null,
    shortestCycle: allCycleLengths.length ? Math.min(...allCycleLengths) : null,
    longestCycle: allCycleLengths.length ? Math.max(...allCycleLengths) : null,
    totalCycles,
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
