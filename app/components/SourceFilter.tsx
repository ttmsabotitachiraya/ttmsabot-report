"use client";

import { Check } from 'lucide-react';

// 1. เพิ่ม export ทำให้ interface นี้เป็น public
export interface Source {
  id: 'gov' | 'herbal' | 'uc';
  label: string;
  color: string;
}

interface SourceFilterProps {
  sources: Source[];
  activeSources: Record<string, boolean>;
  onSourceToggle: (sourceId: string) => void;
}

export default function SourceFilter({ sources, activeSources, onSourceToggle }: SourceFilterProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h3 className="text-md font-semibold text-gray-700 mb-3">เลือกแหล่งรายได้ที่ต้องการแสดงผล:</h3>
      <div className="flex flex-wrap gap-4">
        {sources.map((source) => (
          <button
            key={source.id}
            onClick={() => onSourceToggle(source.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: activeSources[source.id] ? source.color : '#f3f4f6', // gray-100
              color: activeSources[source.id] ? 'white' : '#4b5563', // gray-600
              boxShadow: activeSources[source.id] ? `0 4px 14px 0 ${hexToRgba(source.color, 0.38)}` : 'none',
              borderColor: activeSources[source.id] ? source.color : '#e5e7eb', // gray-200
              borderWidth: '1px'
            }}
          >
            <div
              className="w-4 h-4 rounded-sm flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: activeSources[source.id] ? 'rgba(255,255,255,0.3)' : 'white',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              {activeSources[source.id] && <Check size={12} className="text-white" />}
            </div>
            <span>{source.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : 'rgba(0,0,0,0)';
}