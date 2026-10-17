"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type AttendancePoint = {
  name: string;
  Present: number;
  Absent: number;
  Late: number;
};

const AttendenceChart = ({ data }: { data: AttendancePoint[] }) => {
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="min-w-0 text-base font-semibold sm:text-lg">Attendance</h1>
        <Link
          href="/list/attendance"
          aria-label="View attendance"
          className="icon-btn h-7 w-7"
        >
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </Link>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#d1d5db" }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#d1d5db" }} />
          <Tooltip
            contentStyle={{ borderRadius: "10px", borderColor: "lightgray" }}
          />
          <Legend
            align="left"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}
          />
          <Bar dataKey="Present" fill="#FAE27C" legendType="circle" radius={[10, 10, 0, 0]} />
          <Bar dataKey="Absent" fill="#C3EBFA" legendType="circle" radius={[10, 10, 0, 0]} />
          <Bar dataKey="Late" fill="#CFCEFF" legendType="circle" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendenceChart;
