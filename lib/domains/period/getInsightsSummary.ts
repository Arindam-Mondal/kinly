import type { PredictionResult } from "./periodInsights";

// Plain-language irregularity summary for the Insights screen (tech spec §5.6).
// Generated from the SAME prediction.status flag the dashboard uses — never a forked
// rule. Unlike getDashboardCopy this takes NO sex argument: Insights copy is always
// domain-descriptive ("cycle length", not "your cycle") so the screen reads identically
// whoever is logging. Tone rules (ui.md / spec §6.3): informational, never alarmist,
// never all-caps; significant-delay ends with a soft, conditional provider suggestion.
export function getInsightsSummary(prediction: PredictionResult): string {
  const { status, daysSincePredicted, avgCycleLength } = prediction;
  const late = daysSincePredicted ?? 0;
  const dayWord = Math.abs(late) === 1 ? "day" : "days";
  const avg = avgCycleLength ? `around ${avgCycleLength} days` : "its usual length";

  switch (status) {
    case "insufficient_data":
      return "Log a couple of cycles and Kinly will summarize the pattern here.";

    case "on_track":
      return `Cycle length is tracking close to ${avg} — a steady, regular pattern so far.`;

    case "running_late":
      return `This cycle is running ${late} ${dayWord} longer than the recent average. A little variation from cycle to cycle is common.`;

    case "significant_delay":
      return `This cycle is running ${late} ${dayWord} longer than the recent average. If this pattern continues, it might be worth checking in with a healthcare provider.`;

    case "possible_skip":
      return "A cycle may have been skipped — nothing has been logged for longer than a full average cycle. Logging the next period will refresh the pattern.";
  }
}
