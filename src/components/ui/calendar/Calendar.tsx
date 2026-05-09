import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  classNames?: Record<string, string>;
  getDayStatus?: (date: Date) => "available" | "booked" | undefined;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, mode, selected, onSelect, month: controlledMonth, onMonthChange, classNames, getDayStatus, ...props }, ref) => {
    const today = new Date();
    const [internalMonth, setInternalMonth] = React.useState(controlledMonth ?? today);
    const currentMonth = controlledMonth ?? internalMonth;

    const year = currentMonth.getFullYear();
    const monthIdx = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, monthIdx);
    const firstDay = getFirstDayOfMonth(year, monthIdx);

    const navigateMonth = (delta: number) => {
      const newMonth = new Date(year, monthIdx + delta, 1);
      if (controlledMonth === undefined) setInternalMonth(newMonth);
      onMonthChange?.(newMonth);
    };

    const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === monthIdx && today.getFullYear() === year;

    const isSelected = (day: number) =>
    selected && selected.getDate() === day && selected.getMonth() === monthIdx && selected.getFullYear() === year;

    const getStatus = (day: number) =>
    getDayStatus?.(new Date(year, monthIdx, day));

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div ref={ref} data-slot="calendar" className={cn("bg-background p-3 w-fit", className)} {...props}>
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => navigateMonth(-1)} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted">
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-base font-medium select-none">{MONTHS[monthIdx]} {year}</span>
          <button type="button" onClick={() => navigateMonth(1)} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((d) =>
          <div key={d} className="flex size-10 items-center justify-center text-sm text-muted-foreground select-none">{d}</div>
          )}
          {days.map((day, i) => {
            if (!day) {
              return <div key={i} className="flex size-10 items-center justify-center" />;
            }

            const status = getStatus(day);

            const isBooked = status === "booked";
            const isPast = new Date(year, monthIdx, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isDisabled = isBooked || isPast;

            return (
              <div key={i} className="flex size-10 items-center justify-center">
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onSelect?.(new Date(year, monthIdx, day))}
                  className={cn(
                    "relative inline-flex size-10 items-center justify-center rounded-xl text-sm transition-colors",
                    !isDisabled && "hover:bg-muted",
                    status === "available" && !isPast && "bg-brand-purple/6 text-brand-dark",
                    isDisabled && "opacity-35 cursor-not-allowed",
                    isToday(day) && !isDisabled && "bg-muted font-medium",
                    isSelected(day) && !isDisabled && "bg-primary text-primary-foreground hover:bg-primary/80",
                  )}>
                  <span>{day}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>);

  }
);
Calendar.displayName = "Calendar";

export { Calendar };
