"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // State สำหรับ Desktop sidebar (ย่อ/ขยาย)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  // State สำหรับ Mobile sidebar (ซ่อน/แสดง)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar 
        isDesktopOpen={isDesktopSidebarOpen} 
        setIsDesktopOpen={setIsDesktopSidebarOpen}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />
      
      {/* Container หลักสำหรับเนื้อหา */}
      {/* *** แก้ไขที่บรรทัดนี้: ลบ className ที่เกี่ยวกับ margin-left ออก *** */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header สำหรับ Mobile ที่มีปุ่ม Hamburger */}
        <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
        
        {/* เนื้อหาหลักของแต่ละหน้า */}
        <main className={`flex-1 overflow-y-auto`}>
          <div className="flex-grow">{children}</div>
        </main>
      </div>
    </div>
  );
}