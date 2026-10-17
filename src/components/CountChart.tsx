"use client";

import Image from "next/image";
import Link from "next/link";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

const fills = ["#C3EBFA", "#FAE27C", "#CFCEFF", "#86EFAC", "#F9A8D4"];

const CountChart = ({
  grades,
}: {
  grades: { grade: number; count: number }[];
}) => {
  const total = grades.reduce((sum, grade) => sum + grade.count, 0);
  const data = [
    { name: "Total", count: Math.max(total, 1), fill: "white" },
    ...grades.map((grade, index) => ({
      name: `Grade ${grade.grade}`,
      count: grade.count,
      fill: fills[index % fills.length],
    })),
  ];

  return (
    <div className="w-full rounded-xl bg-white p-4">
      <div className="flex justify-between items-center">
        <h1 className="min-w-0 text-base font-semibold sm:text-lg">Students by grade</h1>
        <Link href="/list/students" aria-label="View students" className="icon-btn h-7 w-7">
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </Link>
      </div>
      <div className="relative h-56 w-full sm:h-64">
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="100%"
            barSize={18}
            data={data}
          >
            <RadialBar background dataKey="count" />
          </RadialBarChart>
        </ResponsiveContainer>
        <Image
          src="/maleFemale.png"
          alt=""
          width={50}
          height={50}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <div className="flex justify-center gap-4 flex-wrap">
        {grades.length === 0 ? (
          <p className="text-xs text-gray-400">No enrolled students yet</p>
        ) : (
          grades.map((grade, index) => (
            <div key={grade.grade} className="flex flex-col gap-1">
              <div
                className="rounded-full w-5 h-5"
                style={{ backgroundColor: fills[index % fills.length] }}
              />
              <h1 className="font-bold">{grade.count}</h1>
              <h2 className="text-xs text-gray-500">
                Grade {grade.grade} (
                {total ? Math.round((grade.count / total) * 100) : 0}%)
              </h2>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CountChart;
