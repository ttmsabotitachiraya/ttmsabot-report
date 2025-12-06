"use client";

import { Menu } from "lucide-react";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    // md:hidden คือ class ที่สำคัญที่สุด ทำให้ component นี้แสดงผลเฉพาะบนจอมือถือ (เล็กกว่า md)
    <header className="md:hidden bg-white p-4 border-b border-gray-200 sticky top-0 z-30">
      <div className="flex justify-between items-center">
        {/* เปลี่ยนเป็นโลโก้แบบ 2 บรรทัด */}
        <div>
          <h2 className="text-lg font-bold text-blue-600">งานแพทย์แผนไทย</h2>
          <p className="text-xs text-gray-500">โรงพยาบาลสระโบสถ์</p>
        </div>
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 active:bg-gray-200"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
}