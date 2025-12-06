// app/components/Header.tsx
interface HeaderProps {
  fiscalYears: number[];
  selectedFiscalYear: number | null;
  onYearChange: (year: number) => void;
  pointRate: number;
  onPointRateChange: (rate: number) => void;
}

export default function Header({
  fiscalYears,
  selectedFiscalYear,
  onYearChange,
  pointRate,
  onPointRateChange,
}: HeaderProps) {
  return (
    <header className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ภาพรวมรายได้</h1>
        <p className="text-gray-500">ข้อมูลปีงบประมาณ {selectedFiscalYear}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="fiscalYear" className="font-medium text-sm text-gray-500">ปีงบประมาณ:</label>
          <select
            id="fiscalYear"
            value={selectedFiscalYear || ''}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-md bg-white text-gray-800
                       hover:border-blue-500 
                       focus:ring-2 focus:ring-blue-500 focus:outline-none 
                       transition-colors duration-200"
          >
            {fiscalYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pointRate" className="font-medium text-sm text-gray-500">1 Point = </label>
          <input
            type="number"
            id="pointRate"
            value={pointRate}
            onChange={(e) => onPointRateChange(parseFloat(e.target.value) || 0)}
            className="p-2 border border-gray-300 rounded-md w-24 text-center text-gray-800
                       hover:border-blue-500 
                       focus:ring-2 focus:ring-blue-500 focus:outline-none
                       transition-colors duration-200"
            step="0.1"
          />
          <span className="font-medium text-sm text-gray-500">บาท</span>
        </div>
      </div>
    </header>
  );
}