"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimePickerProps {
  value?: string; // Expecting "HH:mm" 24h format
  onChange?: (time: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"hour" | "minute">("hour");
  const [selectedHour, setSelectedHour] = React.useState(12);
  const [selectedMinute, setSelectedMinute] = React.useState(0);
  const [selectedPeriod, setSelectedPeriod] = React.useState<"AM" | "PM">("PM");

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const period = h >= 12 ? "PM" : "AM";
        const hour12 = h % 12 || 12;
        setSelectedHour(hour12);
        setSelectedMinute(m);
        setSelectedPeriod(period);
      }
    }
  }, [value]);

  const emitChange = (hour: number, minute: number, period: "AM" | "PM") => {
    if (onChange) {
      let hour24 = hour;
      if (period === "PM" && hour !== 12) hour24 += 12;
      if (period === "AM" && hour === 12) hour24 = 0;
      const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      onChange(timeString);
    }
  };

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    emitChange(hour, selectedMinute, selectedPeriod);
    setMode("minute"); // Auto-switch to minute selection
  };

  const handleMinuteClick = (minute: number) => {
    setSelectedMinute(minute);
    emitChange(selectedHour, minute, selectedPeriod);
  };

  const handlePeriodToggle = (period: "AM" | "PM") => {
    setSelectedPeriod(period);
    emitChange(selectedHour, selectedMinute, period);
  };

  // Clock face numbers
  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const getPosition = (index: number, total: number, radius: number) => {
    const angle = (index * 360 / total) - 90; // Start from top
    const radian = angle * (Math.PI / 180);
    return {
      left: `calc(50% + ${Math.cos(radian) * radius}px - 16px)`,
      top: `calc(50% + ${Math.sin(radian) * radius}px - 16px)`,
    };
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? (
            <span>
              {selectedHour.toString().padStart(2, '0')}:
              {selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
            </span>
          ) : (
            <span>--:--</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 z-[60]" align="start">
        {/* Display */}
        <div className="flex items-center justify-center gap-1 mb-4 text-2xl font-mono">
          <button
            type="button"
            onClick={() => setMode("hour")}
            className={cn(
              "px-2 py-1 rounded transition-colors",
              mode === "hour" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {selectedHour.toString().padStart(2, '0')}
          </button>
          <span>:</span>
          <button
            type="button"
            onClick={() => setMode("minute")}
            className={cn(
              "px-2 py-1 rounded transition-colors",
              mode === "minute" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {selectedMinute.toString().padStart(2, '0')}
          </button>
          <div className="flex flex-col ml-2 text-sm">
            <button
              type="button"
              onClick={() => handlePeriodToggle("AM")}
              className={cn(
                "px-2 py-0.5 rounded transition-colors",
                selectedPeriod === "AM" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handlePeriodToggle("PM")}
              className={cn(
                "px-2 py-0.5 rounded transition-colors",
                selectedPeriod === "PM" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              PM
            </button>
          </div>
        </div>

        {/* Clock Face */}
        <div className="relative w-[200px] h-[200px] rounded-full bg-muted/50 border">
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          {mode === "hour" ? (
            // Hour numbers
            hours.map((hour, i) => {
              const pos = getPosition(i, 12, 80);
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => handleHourClick(hour)}
                  style={pos}
                  className={cn(
                    "absolute w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors",
                    selectedHour === hour
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {hour}
                </button>
              );
            })
          ) : (
            // Minute numbers
            minutes.map((minute, i) => {
              const pos = getPosition(i, 12, 80);
              return (
                <button
                  key={minute}
                  type="button"
                  onClick={() => handleMinuteClick(minute)}
                  style={pos}
                  className={cn(
                    "absolute w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors",
                    selectedMinute === minute
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {minute.toString().padStart(2, '0')}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
