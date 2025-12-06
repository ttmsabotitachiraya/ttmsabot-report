// app/components/ChartContainer.tsx
import React from 'react';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

export default function ChartContainer({ title, children }: ChartContainerProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">{title}</h3>
      <div className="h-80">{children}</div>
    </div>
  );
}