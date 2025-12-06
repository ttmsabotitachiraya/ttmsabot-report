// app/herbal-detail/HerbalDetailClient.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Bubble } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { Pill, Users, FileText, CircleDollarSign, Loader2, TrendingUp, ArrowUpDown } from 'lucide-react';
import { getFiscalYear } from '@/utils/helpers';

// ลงทะเบียน components
ChartJS.register(CategoryScale, LinearScale, PointElement, Tooltip, Legend);

// Interfaces
interface HerbalRawData {
  service_date: Date; // แก้ไข: เปลี่ยนจาก string เป็น Date
  hn: string;
  drug_name: string;
  price_nhso: number;
}
interface SummaryData {
    name: string;
    revenue: number;
    count: number;
    patientCount: number;
}

// Reusable components
const KpiCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-start h-full">
    {/* ไอคอน */}
    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg">
      {icon}
    </div>
    {/* ข้อความ */}
    <div className="mt-4 flex-grow">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1 truncate w-full" title={String(value)}>
        {value}
      </p>
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

export default function HerbalDetailClient() {
  const [allData, setAllData] = useState<HerbalRawData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SummaryData; direction: 'ascending' | 'descending' }>({ key: 'revenue', direction: 'descending' });

  // 1. Fetch data from herbal_detail endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_GAS_API_URL}?page=herbal_detail`;
        const response = await axios.get(apiUrl);
        if (response.data?.success) {
          // ระบุ Type ให้ชัดเจนว่าเป็น HerbalRawData[]
          const data: HerbalRawData[] = response.data.data.map((d: any) => ({
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

  // 2. Process data for KPIs, Bubble Chart, and Summary Table
 const processedData = useMemo(() => {
    if (!allData.length || !selectedFiscalYear) {
      return {
        fiscalYears: [],
        kpis: { totalRevenue: 0, totalPrescriptions: 0, uniquePatients: 0, mostFrequentDrug: 'N/A', highestRevenueDrug: 'N/A' },
        bubbleChartData: { datasets: [] },
        summaryTableData: [],
      };
    }

    const fiscalYears = [...new Set(allData.map(d => getFiscalYear(d.service_date)))].sort((a, b) => b - a);
    let filteredByYear = allData.filter(d => getFiscalYear(d.service_date) === selectedFiscalYear);

    const drugStats: { [key: string]: { revenue: number, count: number, patients: Set<string> } } = {};
    filteredByYear.forEach(d => {
        if (!drugStats[d.drug_name]) drugStats[d.drug_name] = { revenue: 0, count: 0, patients: new Set() };
        drugStats[d.drug_name].revenue += d.price_nhso;
        drugStats[d.drug_name].count += 1;
        drugStats[d.drug_name].patients.add(d.hn);
    });

    const summaryTableData: SummaryData[] = Object.entries(drugStats).map(([name, stats]) => ({
        name,
        revenue: stats.revenue,
        count: stats.count,
        patientCount: stats.patients.size
    }));

    const totalRevenue = summaryTableData.reduce((sum, item) => sum + item.revenue, 0);
    const totalPrescriptions = summaryTableData.reduce((sum, item) => sum + item.count, 0);
    const uniquePatients = new Set(filteredByYear.map(d => d.hn)).size;
    const mostFrequentDrugEntry = summaryTableData.length > 0 ? [...summaryTableData].sort((a,b) => b.count - a.count)[0] : null;
    const mostFrequentDrug = mostFrequentDrugEntry ? mostFrequentDrugEntry.name : 'N/A';
    const highestRevenueDrugEntry = summaryTableData.length > 0 ? [...summaryTableData].sort((a,b) => b.revenue - a.revenue)[0] : null;
    const highestRevenueDrug = highestRevenueDrugEntry ? highestRevenueDrugEntry.name : 'N/A';

    const maxPatientCount = Math.max(...summaryTableData.map(d => d.patientCount), 0) || 1; 
    const MAX_BUBBLE_RADIUS = 50; 

    const bubbleChartData = {
        datasets: [{
            label: 'ยาสมุนไพร',
            data: summaryTableData.map(d => ({
                x: d.count,
                y: d.revenue,
                r: (d.patientCount / maxPatientCount) * MAX_BUBBLE_RADIUS + 5,
                name: d.name
            })),
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgb(16, 185, 129)',
        }]
    };

    return {
      fiscalYears,
      kpis: { totalRevenue, totalPrescriptions, uniquePatients, mostFrequentDrug, highestRevenueDrug },
      bubbleChartData, 
      summaryTableData,
    };
  }, [allData, selectedFiscalYear]);

  const sortedTableData = useMemo(() => {
    let sortableItems = [...processedData.summaryTableData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
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
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
          <p className="text-gray-600">กำลังประมวลผลข้อมูลยาสมุนไพร...</p>
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
          <h1 className="text-2xl font-bold text-gray-800">วิเคราะห์รายได้ยาสมุนไพร (บัตรทอง)</h1>
          <p className="text-gray-500">ข้อมูลปีงบประมาณ {selectedFiscalYear || 'N/A'}</p>
        </div>
        <div className="flex items-center">
            <select value={selectedFiscalYear || ''} onChange={e => setSelectedFiscalYear(Number(e.target.value))} 
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors duration-200">
                {processedData.fiscalYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <KpiCard icon={<CircleDollarSign/>} title="รายได้รวมจากยา" value={`฿${processedData.kpis.totalRevenue.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`} />
        <KpiCard icon={<FileText/>} title="จำนวนครั้งที่จ่ายยา" value={processedData.kpis.totalPrescriptions.toLocaleString('th-TH')} />
        <KpiCard icon={<Users/>} title="ผู้ป่วยที่รับยา (คน)" value={processedData.kpis.uniquePatients.toLocaleString('th-TH')} />
        <KpiCard icon={<Pill/>} title="ยาที่จ่ายบ่อยที่สุด" value={processedData.kpis.mostFrequentDrug} />
        <KpiCard icon={<TrendingUp/>} title="ยาที่รายได้สูงสุด" value={processedData.kpis.highestRevenueDrug} />
      </div>
      
      {/* Visualizations & Table */}
      <div className="grid grid-cols-1 gap-6">
        <ChartContainer title="การกระจายตัวของยาสมุนไพร">
            {/* ใส่ as any เพื่อ bypass type check ของ Bubble Chart */}
          <Bubble 
            data={processedData.bubbleChartData as any} 
            options={{
                plugins: { 
                    tooltip: { 
                        callbacks: { 
                            label: (context) => {
                                const d = context.raw as any;
                                return `${d.name}: รายได้ ${d.y.toLocaleString()} บาท, จ่าย ${d.x} ครั้ง`;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'จำนวนครั้งที่จ่าย →' }},
                    y: { title: { display: true, text: 'รายได้รวม (บาท) →' }}
                }
            }}
          />
        </ChartContainer>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">ตารางสรุปข้อมูลยาสมุนไพร</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">ชื่อยา</th>
                  <th><SortableHeader title="รายได้รวม (บาท)" sortKey="revenue" sortConfig={sortConfig} requestSort={requestSort} /></th>
                  <th><SortableHeader title="จำนวนครั้งที่จ่าย" sortKey="count" sortConfig={sortConfig} requestSort={requestSort} /></th>
                  <th><SortableHeader title="จำนวนผู้ป่วย (คน)" sortKey="patientCount" sortConfig={sortConfig} requestSort={requestSort} /></th>
                </tr>
              </thead>
              <tbody>
                {sortedTableData.map((drug) => (
                  <tr key={drug.name} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{drug.name}</td>
                    <td className="px-6 py-4 text-right">{drug.revenue.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right">{drug.count.toLocaleString('th-TH')}</td>
                    <td className="px-6 py-4 text-right">{drug.patientCount.toLocaleString('th-TH')}</td>
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