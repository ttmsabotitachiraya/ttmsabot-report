// app/components/SidebarWrapper.tsx
"use client";

import { useState } from 'react';
import Sidebar from './Sidebar';

export default function SidebarWrapper() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // เราต้องปรับ style ของ main content จากตรงนี้
  // แต่เนื่องจาก main อยู่ใน layout.tsx เราจะใช้ CSS หรือวิธีอื่น
  // เพื่อความง่ายตอนนี้ เราจะเอา margin ออกไปก่อน แล้วไปปรับที่ Sidebar โดยตรง
  
  return (
     <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
  );
}