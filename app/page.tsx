// app/page.tsx
"use client"; // หน้า dashboard หลักยังต้องเป็น client component

import DashboardClient from './components/DashboardClient';
// ลบ import Footer ออกจากหน้านี้ ถ้าคุณย้ายไป layout
// ลบ import Sidebar ออก

export default function HomePage() {
  // ลบ useState ของ isSidebarOpen ออก
  return (
    // ลบ div และ main ที่เคยมีออกทั้งหมด
    <DashboardClient />
  );
}