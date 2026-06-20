// Domain-agnostic calendar types. The Calendar component knows nothing about
// "periods" — callers pass entries tagged with a styleKey and a config that maps
// each styleKey to its look + legend label.

export type ISODate = string; // 'YYYY-MM-DD'

export type CalendarEntry = {
  id: string;
  startDate: ISODate;
  endDate: ISODate | null; // null = single-day entry
  styleKey: string; // must exist in CalendarConfig.styles
};

export type DayStyle = {
  label: string; // shown in the legend
  fillClass: string; // background/text classes for a covered day
  outline?: boolean; // dashed outline instead of solid fill (e.g. predicted)
};

export type CalendarConfig = {
  styles: Record<string, DayStyle>;
};
