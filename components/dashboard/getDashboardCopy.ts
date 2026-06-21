import { formatHuman } from "@/components/calendar/calendarUtils";
import type { PeriodStatus, PredictionResult } from "@/lib/domains/period/periodInsights";

// THE single place sex changes any behaviour in the whole app (tech spec §7).
// Male users typically log for a partner, so the framing is neutral / third-person
// instead of first-person "your cycle". Every other screen is identical regardless
// of sex — do not add another sex branch elsewhere.
export type Sex = "female" | "male" | "other" | "prefer_not_to_say";

export type DashboardCopy = {
  title: string; // headline next to the cycle ring
  body: string; // supporting sentence
  statusLabel: string; // short word for the Status stat card
};

const STATUS_LABELS: Record<PeriodStatus, string> = {
  insufficient_data: "Tracking",
  on_track: "On track",
  running_late: "Late",
  significant_delay: "Delayed",
  possible_skip: "Skip?",
};

function dayWord(n: number): string {
  return Math.abs(n) === 1 ? "day" : "days";
}

export function getDashboardCopy(sex: Sex, prediction: PredictionResult): DashboardCopy {
  const neutral = sex === "male";
  const statusLabel = STATUS_LABELS[prediction.status];

  const { currentCycleDay, predictedNextStart, daysUntilPredicted, daysSincePredicted, status } =
    prediction;

  const title = neutral ? `Cycle day ${currentCycleDay}` : `Day ${currentCycleDay} of your cycle`;
  // "your average cycle" vs "the average cycle"
  const avgPhrase = neutral ? "the average cycle" : "your average cycle";

  switch (status) {
    case "insufficient_data":
      return {
        statusLabel,
        title,
        body: "Log one more cycle and Kinly can start predicting the next period.",
      };

    case "on_track": {
      const date = predictedNextStart ? formatHuman(predictedNextStart) : "";
      const lead = neutral ? "Next period expected" : "Your next period is expected";
      const body =
        daysUntilPredicted != null && daysUntilPredicted > 0
          ? `${lead} around ${date} (in ${daysUntilPredicted} ${dayWord(daysUntilPredicted)}).`
          : `${lead} around now (${date}).`;
      return { statusLabel, title, body };
    }

    case "running_late":
      return {
        statusLabel,
        title,
        body: `This is ${daysSincePredicted} ${dayWord(daysSincePredicted ?? 0)} later than ${avgPhrase}.`,
      };

    case "significant_delay":
      return {
        statusLabel,
        title,
        body: `This is ${daysSincePredicted} ${dayWord(
          daysSincePredicted ?? 0,
        )} later than ${avgPhrase}. If this continues, it might be worth checking in with a healthcare provider.`,
      };

    case "possible_skip":
      return {
        statusLabel,
        title,
        body: "It looks like a cycle may have been skipped this month.",
      };
  }
}
