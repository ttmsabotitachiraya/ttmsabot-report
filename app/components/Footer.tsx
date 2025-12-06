// app/components/Footer.tsx

export default function Footer() {
  const currentYear = new Date().getFullYear() + 543; // แปลงเป็น พ.ศ.

  return (
    <footer className="w-full mt-8 py-4 px-8 border-t border-gray-200 bg-white">
      <div className="text-center text-sm text-gray-500">
        <p>
          &copy; {currentYear} โรงพยาบาลสระโบสถ์. พัฒนาและออกแบบเพื่อการแสดงผลข้อมูล.
        </p>
      </div>
    </footer>
  );
}