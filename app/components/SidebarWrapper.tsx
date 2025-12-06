// app/components/SidebarWrapper.tsx
"use client";

import { useState } from 'react';
import Sidebar from './Sidebar';

export default function SidebarWrapper() {
  // แยก State เป็น 2 ชุด สำหรับหน้าจอคอม (Desktop) และมือถือ (Mobile)
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
     <Sidebar 
        isDesktopOpen={isDesktopOpen} 
        setIsDesktopOpen={setIsDesktopOpen}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
     />
  );
}