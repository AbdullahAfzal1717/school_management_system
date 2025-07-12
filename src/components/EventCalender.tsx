"use client";

import Image from "next/image";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Temporary Data
const Events = [
  {
    id: 1,
    title: "Team Meeting",
    time: "10:00 AM",
    description: "Weekly sync with the development team.",
  },
  {
    id: 2,
    title: "Lunch Break",
    time: "12:30 PM",
    description: "Quick break to recharge and eat.",
  },
  {
    id: 3,
    title: "Client Call",
    time: "03:00 PM",
    description: "Discuss project milestones with the client.",
  },
];

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalender = () => {
  const [value, onChange] = useState<Value>(new Date());

  return (
    <div className="bg-white rounded-md p-4">
      <Calendar onChange={onChange} value={value} />
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold my-4 ">Events</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <div className="flex flex-col gap-4">
        {Events.map((event) => (
          <div
            className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-AbSky even:border-t-AbPurple"
            key={event.id}
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-gray-600">{event.title}</h1>
              <span className="text-xs text-gray-300"> {event.time} </span>
            </div>
            <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCalender;
