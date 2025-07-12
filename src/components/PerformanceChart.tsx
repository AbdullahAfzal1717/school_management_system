"use client";

import { PieChart, Pie, ResponsiveContainer } from "recharts";
import Image from "next/image";

const data = [
  { name: "Group A", value: 92, fill: "#C3EBFA" },
  { name: "Group B", value: 8, fill: "#FAE27C" },
];

const PerformanceChart = () => {
  return (
    <div className="rounded-md p-4 bg-white h-80 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Performance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            fill="#8884d8"
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h2 className=" text-3xl font-bold">9.2</h2>
        <p className="text-xs text-gray-500">of 10 max TS</p>
      </div>
      <div className="absolute left-0 right-0 bottom-16 m-auto text-center font-medium">
        1st Semester - 2nd Semester
      </div>
    </div>
  );
};

export default PerformanceChart;
