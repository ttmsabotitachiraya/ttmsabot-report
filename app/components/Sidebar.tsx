"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard,  
  ShieldCheck,
  Pill, 
  HeartHandshake, 
  ChevronDown,
  BookHeart,
  ChevronFirst,
  ChevronLast,
  Landmark
} from 'lucide-react';

interface SidebarProps {
  isDesktopOpen: boolean;
  setIsDesktopOpen: (isOpen: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { 
    name: 'ภาพรวมทั้งหมด', 
    icon: LayoutDashboard, 
    href: '/' 
  },
  { 
    name: 'สิทธิข้าราชการ', 
    icon: Landmark, 
    subItems: [
      { name: 'ยาสมุนไพรและหัตถการ', icon: BookHeart, href: '/gov-detail' }
    ] 
  },
  { 
    name: 'สิทธิบัตรทอง', 
    icon: ShieldCheck, 
    subItems: [
      { name: 'ยาสมุนไพร', icon: Pill, href: '/herbal-detail' },
      { name: 'หัตถการ', icon: HeartHandshake, href: '/uc-detail' }
    ] 
  },
];

export default function Sidebar({ isDesktopOpen, setIsDesktopOpen, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  const getInitialOpenMenu = () => {
    const activeParent = menuItems.find(item => 
      item.subItems && item.subItems.some(sub => sub.href === pathname)
    );
    return activeParent ? activeParent.name : null;
  };
  const [openMenu, setOpenMenu] = useState<string | null>(getInitialOpenMenu());

  const handleMenuToggle = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };
  
  // ปิดเมนูย่อยเมื่อ Sidebar หลัก (Desktop) ถูกย่อ
  useEffect(() => {
    if (!isDesktopOpen) {
      setOpenMenu(null);
    }
  }, [isDesktopOpen]);

  // ปิด Sidebar (Mobile) เมื่อเปลี่ยนหน้า
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const sidebarContent = (
    <>
      <div className={`p-4 flex items-center ${isDesktopOpen ? 'justify-between' : 'justify-center'}`}>
        <div className={`flex items-center gap-2 overflow-hidden transition-all ${isDesktopOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
          {/* เปลี่ยนเป็น 2 บรรทัดเพื่อความสวยงาม */}
          <div>
            <h2 className="text-xl font-bold text-blue-600 whitespace-nowrap">งานแพทย์แผนไทย</h2>
            <p className="text-xs text-gray-500 whitespace-nowrap">โรงพยาบาลสระโบสถ์</p>
          </div>
        </div>
        <button onClick={() => setIsDesktopOpen(!isDesktopOpen)} className="hidden md:block p-2 rounded-lg hover:bg-gray-100">
          {isDesktopOpen ? <ChevronFirst /> : <ChevronLast />}
        </button>
      </div>

      <nav className="flex-1 mt-6 px-2 space-y-2">
        {menuItems.map((item) => {
          if (item.subItems) {
            const isParentActive = item.subItems.some(sub => sub.href === pathname);
            return (
              <div key={item.name}>
                <button 
                  onClick={() => handleMenuToggle(item.name)}
                  className={`flex items-center justify-between w-full px-3 py-3 rounded-lg transition-colors ${
                    isParentActive ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
                  } ${!isDesktopOpen ? 'justify-center' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={22} />
                    <span className={`overflow-hidden transition-all whitespace-nowrap ${isDesktopOpen ? 'w-auto' : 'w-0'}`}>
                      {item.name}
                    </span>
                  </div>
                  {isDesktopOpen && <ChevronDown size={16} className={`transition-transform ${openMenu === item.name ? 'rotate-180' : ''}`} />}
                </button>
                {openMenu === item.name && isDesktopOpen && (
                  <ul className="pt-2 pl-7 space-y-1">
                    {item.subItems.map(subItem => {
                      const isActive = pathname === subItem.href;
                      return (
                        <li key={subItem.name}>
                          <Link href={subItem.href}
                            className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <subItem.icon size={18} />
                            <span>{subItem.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          }
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
              } ${!isDesktopOpen ? 'justify-center' : ''}`}
            >
              <item.icon size={22} />
              <span className={`overflow-hidden transition-all whitespace-nowrap ${isDesktopOpen ? 'w-auto' : 'w-0'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div 
        onClick={() => setIsMobileOpen(false)}
        className={`fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity md:hidden ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside className={`fixed top-0 left-0 h-full bg-white text-gray-800 flex flex-col border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out md:hidden w-64 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ใช้ isDesktopOpen={true} สำหรับ Mobile เพื่อให้แสดงข้อความเต็มเสมอ */}
        {sidebarContent}
      </aside>
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col h-full bg-white text-gray-800 border-r border-gray-200 transition-all duration-300 ease-in-out flex-shrink-0 ${
          isDesktopOpen ? 'w-64' : 'w-20'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}