"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/calendar";

const localizer = momentLocalizer(moment);

const BigCalendar = ({ events }: { events: CalendarEvent[] }) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
      })),
    [events],
  );
  const min = new Date();
  min.setHours(8, 0, 0, 0);
  const max = new Date();
  max.setHours(17, 0, 0, 0);

  if (calendarEvents.length === 0) {
    return <p className="mt-4 text-sm text-gray-400">No lessons scheduled.</p>;
  }

  return (
    <Calendar
      localizer={localizer}
      events={calendarEvents}
      startAccessor="start"
      endAccessor="end"
      views={["work_week", "day"]}
      view={view}
      onView={setView}
      style={{ height: "100%", minHeight: 480 }}
      min={min}
      max={max}
    />
  );
};

export default BigCalendar;
