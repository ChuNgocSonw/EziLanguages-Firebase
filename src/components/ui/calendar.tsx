
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { ScrollArea } from "./scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium hidden",
        caption_dropdowns: "flex justify-center gap-1 w-full",
        vhidden: "hidden",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
        Dropdown: (props: DropdownProps) => {
          const { fromDate, toDate, fromMonth, toMonth, fromYear, toYear } =
            props;
          const { onMonthChange, onYearChange } = props;
          const months: { value: string; label: string }[] = [];
          if (fromMonth && toMonth) {
            for (
              let i = fromMonth.getMonth();
              i <= toMonth.getMonth();
              i++
            ) {
              months.push({
                value: i.toString(),
                label: new Date(new Date().getFullYear(), i).toLocaleString(
                  "default",
                  { month: "long" }
                ),
              });
            }
          }
          const years: { value: string; label: string }[] = [];
          if (fromYear && toYear) {
            for (let i = fromYear; i <= toYear; i++) {
              years.push({ value: i.toString(), label: i.toString() });
            }
          }
          return (
            <div className="flex gap-1.5 w-full">
              {props.name === "months" ? (
                <Select
                  value={props.value?.toString()}
                  onValueChange={(value) => {
                    onMonthChange?.(new Date(new Date().getFullYear(), parseInt(value)));
                  }}
                  
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {new Date(new Date().getFullYear(), Number(props.value)).toLocaleString("default", {
                        month: "long",
                      })}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={props.value?.toString()}
                  onValueChange={(value) => {
                    onYearChange?.(new Date(parseInt(value), new Date().getMonth()));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{props.value}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className={classNames?.dropdown_year}>
                     <ScrollArea className="h-[var(--scroll-area-height,10rem)] pr-2">
                        {years.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                            {year.label}
                        </SelectItem>
                        ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
