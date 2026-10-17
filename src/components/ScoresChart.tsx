"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ScoresChart = ({
  data,
}: {
  data: { name: string; average: number }[];
}) => {
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="min-w-0 pr-2 text-base font-semibold sm:text-lg">Average score by subject</h1>
        <Link href="/list/results" aria-label="View results" className="icon-btn h-7 w-7">
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </Link>
      </div>
      {data.length === 0 ? (
        <p className="mt-8 text-sm text-gray-400">No exam results yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={64}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickMargin={8}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#d1d5db" }}
              tickMargin={10}
            />
            <Tooltip />
            <Legend
              align="center"
              verticalAlign="top"
              wrapperStyle={{ paddingTop: "10px", paddingBottom: "20px" }}
            />
            <Line type="monotone" dataKey="average" stroke="#CFCEFF" strokeWidth={4} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ScoresChart;
