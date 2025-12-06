// utils/helpers.ts
/**
 * คำนวณปีงบประมาณจากวันที่
 * @param {Date} date - วันที่ที่ต้องการคำนวณ
 * @returns {number} ปีงบประมาณในรูปแบบ พ.ศ.
 */
export function getFiscalYear(date: Date): number {
  let year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
  const month = date.getMonth(); // 0 = มกราคม, 9 = ตุลาคม

  // ปีงบประมาณเริ่มที่เดือนตุลาคม (month index = 9)
  if (month >= 9) {
    return year + 1;
  } else {
    return year;
  }
}