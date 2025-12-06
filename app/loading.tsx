// app/loading.tsx
import { Loader2 } from 'lucide-react';

export default function Loading() {
  // คุณสามารถสร้าง UI Loading ที่สวยงามได้ที่นี่
  return (
    <div className="flex flex-grow items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );
}