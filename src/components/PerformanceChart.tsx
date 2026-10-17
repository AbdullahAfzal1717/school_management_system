"use client";

import { Pie, PieChart, ResponsiveContainer } from "recharts";

const PerformanceChart = ({
  score,
  label,
}: {
  score: number;
  label: string;
}) => {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const data = [
    { name: "Score", value, fill: "#C3EBFA" },
    { name: "Remaining", value: 100 - value, fill: "#FAE27C" },
  ];

  return (
    <div className="rounded-md p-4 bg-white h-80 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Performance</h1>
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
        <h2 className="text-3xl font-bold">{(value / 10).toFixed(1)}</h2>
        <p className="text-xs text-gray-500">of 10</p>
      </div>
      <div className="absolute left-0 right-0 bottom-16 m-auto text-center font-medium">
        {label}
      </div>
    </div>
  );
};

export default PerformanceChart;
