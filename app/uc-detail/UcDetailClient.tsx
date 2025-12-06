// app/uc-detail/UcDetailClient.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Activity, Users, FileText, CircleDollarSign, Loader2, ArrowUpDown } from 'lucide-react';
import { getFiscalYear } from '@/utils/helpers';

// ลงทะเบียน components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

// Interfaces
interface UcRawData {
  service_date: Date; // แก้ไข: เปลี่ยนจาก string เป็น Date
  cid: string;
  procedure_name: string;
  points: number;
}
interface SummaryData {
    name: string;
    total_points: number;
    count: number;
    patientCount: number;
    estimated_revenue: number;
}

// Reusable components
const KpiCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-start h-full">
    <div className="bg-amber-100 text-amber-600 p-3 rounded-lg">{icon}</div>
    <div className="mt-4 flex-grow">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1 truncate w-full" title={String(value)}>{value}</p>
    </div>
  </div>
);

const ChartContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">{title}</h3>
      <div className="h-96 relative">{children}</div>
  </div>
);

const SortableHeader = ({ title, sortKey, sortConfig, requestSort }: { title: string, sortKey: keyof SummaryData, sortConfig: any, requestSort: (key: keyof SummaryData) => void }) => (
    <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2 px-6 py-3 text-left w-full justify-end hover:bg-gray-200 rounded-md">
      {title}
      <ArrowUpDown size={14} className={sortConfig.key === sortKey ? 'text-gray-800' : 'text-gray-300'} />
    </button>
  );

export default function UcDetailClient() {
  const [selectedProcedure, setSelectedProcedure] = useState<string>('all');
  const [allData, setAllData] = useState<UcRawData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(null);
  const [pointRate, setPointRate] = useState<number>(1.0);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SummaryData; direction: 'ascending' | 'descending' }>({ key: 'total_points', direction: 'descending' });

  // 1. Fetch data from uc_detail endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_GAS_API_URL}?page=uc_detail`;
        const response = await axios.get(apiUrl);
        if (response.data?.success) {
          // ระบุ Type ให้ชัดเจน
          const data: UcRawData[] = response.data.data.map((d: any) => ({
              ...d,
              service_date: new Date(d.service_date)
          }));
          setAllData(data);
          if (data.length > 0) {
            const latestYear = Math.max(...data.map((d) => getFiscalYear(d.service_date)));
            setSelectedFiscalYear(latestYear);
          }
        } else {
          throw new Error(response.data.message || "Failed to fetch data.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

   // --- 2. ปรับปรุง Logic การประมวลผลทั้งหมด ---
  const processedData = useMemo(() => {
    if (!allData.length || !selectedFiscalYear) {
      return {
        fiscalYears: [],
        procedures: [],
        kpis: { totalRevenue: 0, totalPoints: 0, totalVisits: 0, uniquePatients: 0, revenuePerVisit: 0 },
        comboChartData: { labels: [], datasets: [] },
        summaryTableData: [],
      };
    }

    const fiscalYears = [...new Set(allData.map(d => getFiscalYear(d.service_date)))].sort((a, b) => b - a);
    let filteredByYear = allData.filter(d => getFiscalYear(d.service_date) === selectedFiscalYear);
    const procedures = ['all', ...new Set(filteredByYear.map(d => d.procedure_name))];

    // KPI Calculations
    const dataForKpi = selectedProcedure === 'all' 
      ? filteredByYear 
      : filteredByYear.filter(d => d.procedure_name === selectedProcedure);

    const totalPoints = dataForKpi.reduce((sum, item) => sum + item.points, 0);
    const totalRevenue = totalPoints * pointRate;
    const uniquePatients = new Set(dataForKpi.map(d => d.cid)).size;
    const uniqueVisits = new Set(dataForKpi.map(d => `${new Date(d.service_date).toDateString()}|${d.cid}`)).size;
    const revenuePerVisit = uniqueVisits > 0 ? totalRevenue / uniqueVisits : 0;

    // Combo Chart Calculations
    const monthlyStats: { [key: string]: { revenue: number, patientCids: Set<string> } } = {};
    
    const dataForChart = selectedProcedure === 'all'
      ? filteredByYear
      : filteredByYear.filter(d => d.procedure_name === selectedProcedure);

    dataForChart.forEach(d => {
        const monthKey = new Date(d.service_date).toLocaleString('th-TH', { month: 'short' });
        if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { revenue: 0, patientCids: new Set() };
        monthlyStats[monthKey].patientCids.add(d.cid);
        monthlyStats[monthKey].revenue += d.points * pointRate;
    });

    const monthOrder = ["ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย."];
    const chartLabels = Object.keys(monthlyStats).sort((a,b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

    const comboChartData = {
        labels: chartLabels,
        datasets: [
            {
                type: 'bar' as const,
                label: `รายได้ (${selectedProcedure === 'all' ? 'รวม' : selectedProcedure})`,
                data: chartLabels.map(month => monthlyStats[month]?.revenue || 0),
                backgroundColor: 'rgba(245, 159, 11, 0.56)',
                borderColor: 'rgb(245, 158, 11)',
                yAxisID: 'y',
                order: 1
            },
            {
                type: 'line' as const,
                label: 'จำนวนผู้ป่วย (คน)',
                data: chartLabels.map(month => monthlyStats[month]?.patientCids.size || 0),
                borderColor: 'rgb(20, 184, 166)',
                backgroundColor: 'rgba(20, 184, 166, 0.2)',
                fill: true,
                yAxisID: 'y1',
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: 'rgb(20, 184, 166)',
                order: 2
            }
        ]
    };

    // --- Summary Table Calculations ---
    const procedureStats: { [key: string]: { points: number, count: number, patients: Set<string> } } = {};
    filteredByYear.forEach(d => {
        if (!procedureStats[d.procedure_name]) procedureStats[d.procedure_name] = { points: 0, count: 0, patients: new Set() };
        procedureStats[d.procedure_name].points += d.points;
        procedureStats[d.procedure_name].count += 1;
        procedureStats[d.procedure_name].patients.add(d.cid);
    });
    const summaryTableData: SummaryData[] = Object.entries(procedureStats).map(([name, stats]) => ({
        name, total_points: stats.points, count: stats.count,
        patientCount: stats.patients.size, estimated_revenue: stats.points * pointRate,
    }));

    return {
      fiscalYears,
      procedures,
      kpis: { totalRevenue, totalPoints, totalVisits: uniqueVisits, uniquePatients, revenuePerVisit },
      comboChartData,
      summaryTableData,
    };
  }, [allData, selectedFiscalYear, pointRate, selectedProcedure]);


  // Logic for sorting the table
  const sortedTableData = useMemo(() => {
    let sortableItems = [...processedData.summaryTableData];
    sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    return sortableItems;
  }, [processedData.summaryTableData, sortConfig]);

  const requestSort = (key: keyof SummaryData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
          <p className="text-gray-600">กำลังประมวลผลข้อมูลหัตถการ...</p>
        </div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-red-500">เกิดข้อผิดพลาด: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header & Filters */}
      <header className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">วิเคราะห์รายได้หัตถการ (บัตรทอง)</h1>
          <p className="text-gray-500">ข้อมูลปีงบประมาณ {selectedFiscalYear || 'N/A'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <select value={selectedProcedure} onChange={e => setSelectedProcedure(e.target.value)}
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors duration-200">
                {processedData.procedures.map(p => <option key={p} value={p}>{p === 'all' ? 'หัตถการทั้งหมด' : p}</option>)}
            </select>
            <select value={selectedFiscalYear || ''} onChange={e => setSelectedFiscalYear(Number(e.target.value))} 
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors duration-200">
                {processedData.fiscalYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label htmlFor="pointRate" className="font-medium text-sm text-gray-600">1 Point = </label>
              <input type="number" id="pointRate" value={pointRate} onChange={(e) => setPointRate(parseFloat(e.target.value) || 0)}
                  className="p-2 border border-gray-300 rounded-md w-24 text-center text-gray-800 hover:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors duration-200"
                  step="0.1"
              />
              <span className="font-medium text-sm text-gray-600">บาท</span>
            </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
        <KpiCard icon={<CircleDollarSign/>} title="รายได้ประมาณการ" value={`฿${processedData.kpis.totalRevenue.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`} />
        <KpiCard icon={<Activity/>} title="แต้ม (Points) รวม" value={processedData.kpis.totalPoints.toLocaleString('th-TH')} />
        <KpiCard icon={<FileText/>} title="จำนวนครั้งที่รับบริการ" value={processedData.kpis.totalVisits.toLocaleString('th-TH')} />
        <KpiCard icon={<Users/>} title="จำนวนผู้ป่วย (คน)" value={processedData.kpis.uniquePatients.toLocaleString('th-TH')} />
        <KpiCard icon={<CircleDollarSign/>} title="รายได้เฉลี่ย/ครั้ง" value={`฿${processedData.kpis.revenuePerVisit.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`} />
      </div>
      
      {/* Visualizations & Table */}
      <div className="grid grid-cols-1 gap-6">
        <ChartContainer title={`แนวโน้มรายได้ (${selectedProcedure === 'all' ? 'รวมทุกหัตถการ' : selectedProcedure}) และจำนวนผู้ป่วยรายเดือน`}>
          {/* ใส่ as any เพื่อ bypass type check สำหรับ Combo Chart */}
          <Bar 
            data={processedData.comboChartData as any} 
            options={{ 
            scales: { 
              y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'ประมาณการรายได้ (บาท)' } }, 
              y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'จำนวนผู้ป่วย (คน)' } } 
            },
            plugins: { 
              legend: { 
                display: true,
                position: 'top',
                align: 'center',
                labels: {
                  boxWidth: 20,
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'rectRounded'
                }
              } 
            }
          }}/>
        </ChartContainer>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">ตารางสรุปข้อมูลหัตถการ (ภาพรวมทั้งปี)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">ชื่อหัตถการ</th>
                  <th><SortableHeader title="รวม Points" sortKey="total_points" sortConfig={sortConfig} requestSort={requestSort} /></th>
                  <th><SortableHeader title="จำนวนครั้ง" sortKey="count" sortConfig={sortConfig} requestSort={requestSort} /></th>
                  <th><SortableHeader title="จำนวนผู้ป่วย (คน)" sortKey="patientCount" sortConfig={sortConfig} requestSort={requestSort} /></th>
                  <th><SortableHeader title="รายได้ประมาณการ" sortKey="estimated_revenue" sortConfig={sortConfig} requestSort={requestSort} /></th>
                </tr>
              </thead>
              <tbody>
                {sortedTableData.map((proc) => (
                  <tr key={proc.name} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{proc.name}</td>
                    <td className="px-6 py-4 text-right">{proc.total_points.toLocaleString('th-TH')}</td>
                    <td className="px-6 py-4 text-right">{proc.count.toLocaleString('th-TH')}</td>
                    <td className="px-6 py-4 text-right">{proc.patientCount.toLocaleString('th-TH')}</td>
                    <td className="px-6 py-4 text-right">{proc.estimated_revenue.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}