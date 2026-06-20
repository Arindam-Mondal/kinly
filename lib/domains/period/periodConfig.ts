import type { CalendarConfig } from "@/lib/types/calendar";

// Period-domain render config for the domain-agnostic Calendar. Keeping this here
// (not inside Calendar) is the extensibility contract: a future migraine domain adds
// its own config without touching the shared component.
export const PERIOD_STYLE_LOGGED = "logged";
export const PERIOD_STYLE_PREDICTED = "predicted";

export const periodCalendarConfig: CalendarConfig = {
  styles: {
    [PERIOD_STYLE_LOGGED]: { label: "Logged period", fillClass: "bg-accent text-ink" },
    // Used once predictions land (step 6); defined now so the legend/contract are ready.
    [PERIOD_STYLE_PREDICTED]: {
      label: "Predicted",
      fillClass: "border-2 border-dashed border-accent text-ink",
      outline: true,
    },
  },
};
