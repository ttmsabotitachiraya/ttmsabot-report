// app/components/LoadingSpinner.tsx
"use client";

import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    // ใช้ min-h-[70vh] เพื่อบังคับให้เนื้อหาอยู่กลางจอเสมอ
    <div className="flex w-full min-h-[70vh] flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* วงแหวน Ping ด้านหลัง */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-blue-100 opacity-75"></div>
        
        {/* ไอคอนหมุน */}
        <Loader2 className="relative h-12 w-12 animate-spin text-blue-600" />
      </div>

      <div className="mt-6 flex flex-col items-center gap-1">
        <p className="text-lg font-semibold text-gray-700 animate-pulse">
          กำลังประมวลผลข้อมูล...
        </p>
        <p className="text-sm text-gray-400">
          กรุณารอสักครู่
        </p>
      </div>
    </div>
  );
}