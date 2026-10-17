"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type CalendarValue = Date | null | [Date | null, Date | null];

export type CalendarEventItem = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
};

function localDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const EventCalender = ({ events }: { events: CalendarEventItem[] }) => {
  const [value, onChange] = useState<CalendarValue>(new Date());
  const selected = value instanceof Date ? value : new Date();
  const selectedKey = localDateKey(selected);
  const todayKey = localDateKey(new Date());
  const onSelectedDay = events.filter((event) => event.date === selectedKey);
  const upcoming = events.filter((event) => event.date >= todayKey).slice(0, 4);
  const shown = onSelectedDay.length > 0 ? onSelectedDay : upcoming;

  return (
    <div className="bg-white rounded-md p-4">
      <Calendar onChange={onChange} value={value} />
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold my-4">
          {onSelectedDay.length > 0 ? "Events" : "Upcoming events"}
        </h1>
        <Link href="/list/events" aria-label="View all events" className="icon-btn h-7 w-7">
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {shown.length === 0 ? (
          <p className="text-sm text-gray-400">No events scheduled.</p>
        ) : (
          shown.map((event) => (
            <div
              className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-AbSky even:border-t-AbPurple"
              key={event.id}
            >
              <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="break-words font-semibold text-gray-600">{event.title}</h1>
                <span className="shrink-0 text-xs text-gray-300">
                  {event.date} · {event.startTime}
                </span>
              </div>
              <p className="mt-2 break-words text-sm text-gray-400">{event.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventCalender;
