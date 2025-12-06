"use client";

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { TrendingUp, CircleDollarSign, CalendarDays, Loader2 } from 'lucide-react';

// Import new and existing components
import Header from './Header';
import ChartContainer from './ChartContainer';
import SourceFilter, { type Source } from './SourceFilter'; 


// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Interfaces
interface RevenueData {
  เดือน: string;
  gov_thaibaht: number;
  herbal_drug: number;
  uc_point: number;
  ปีงบประมาณ: number; // <--- แก้ไขจุดนี้ให้ถูกต้อง
}

// กำหนดข้อมูลแหล่งรายได้และสี
const REVENUE_SOURCES: Source[] = [
  { id: 'gov', label: 'รายได้หัตถการและยาสมุนไพรสิทธิข้าราชการ', color: 'rgb(99, 102, 241)' }, // สีคราม (Indigo)
  { id: 'herbal', label: 'รายได้ยาสมุนไพรสิทธิบัตรทอง', color: 'rgb(16, 185, 129)' }, // สีเขียวมรกต (Emerald)
  { id: 'uc', label: 'รายได้หัตถการสิทธิบัตรทอง(ประมาณการ)', color: 'rgb(245, 158, 11)' }, // สีส้มแอมเบอร์ (Amber)
];

export default function DashboardClient() {
  // States
  const [allData, setAllData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(null);
  const [pointRate, setPointRate] = useState<number>(1.0);
  
  // เพิ่ม State สำหรับควบคุมการแสดงผลแหล่งรายได้
  const [activeSources, setActiveSources] = useState<Record<string, boolean>>({
    gov: true,
    herbal: true,
    uc: true,
  });

  // Fetching data effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
        if (!apiUrl) throw new Error("API URL is not defined.");

        const response = await axios.get(apiUrl);
        if (response.data?.success) {
          const sortedData = response.data.data.sort((a: RevenueData, b: RevenueData) => new Date(b.เดือน).getTime() - new Date(a.เดือน).getTime());
          setAllData(sortedData);
          if (sortedData.length > 0) {
            const latestYear = Math.max(...sortedData.map((d: RevenueData) => d.ปีงบประมาณ));
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

  // ปรับปรุง Logic การคำนวณใน useMemo ครั้งใหญ่
  const { filteredData, summary, fiscalYears } = useMemo(() => {
    if (!allData.length || !selectedFiscalYear) {
      return { 
        filteredData: [], 
        summary: { total: 0, avg: 0, maxMonth: '', maxMonthValue: 0 }, 
        fiscalYears: [] 
      };
    }
    const years = [...new Set(allData.map(d => d.ปีงบประมาณ))].sort((a, b) => b - a);
    const dataForYear = allData.filter(d => d.ปีงบประมาณ === selectedFiscalYear);
    
    const processed = dataForYear.map(d => {
      const gov_revenue = activeSources.gov ? d.gov_thaibaht : 0;
      const herbal_revenue = activeSources.herbal ? d.herbal_drug : 0;
      const uc_point_baht = activeSources.uc ? d.uc_point * pointRate : 0;
      
      const total_revenue = gov_revenue + herbal_revenue + uc_point_baht;
      
      return { 
        ...d, 
        uc_point_baht, 
        total_revenue, 
        gov_thaibaht_filtered: gov_revenue, 
        herbal_drug_filtered: herbal_revenue 
      };
    }).sort((a, b) => new Date(a.เดือน).getTime() - new Date(b.เดือน).getTime());

    const totalRevenue = processed.reduce((sum, item) => sum + item.total_revenue, 0);
    const avgRevenue = processed.length > 0 ? totalRevenue / processed.length : 0;
    const maxRevenueItem = processed.reduce((max, item) => item.total_revenue > max.total_revenue ? item : max, { total_revenue: -Infinity, เดือน: '' });

    return {
      filteredData: processed,
      summary: {
        total: totalRevenue,
        avg: avgRevenue,
        maxMonth: maxRevenueItem.เดือน,
        maxMonthValue: maxRevenueItem.total_revenue > 0 ? maxRevenueItem.total_revenue : 0,
      },
      fiscalYears: years,
    };
  }, [allData, selectedFiscalYear, pointRate, activeSources]);

  // ปรับ Chart Data ให้เป็นแบบ Dynamic
  const chartLabels = filteredData.map(d => new Date(d.เดือน).toLocaleString('th-TH', { month: 'short' }));
  
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
  };

  const lineChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'รายได้รวม (ตามที่เลือก)', 
      data: filteredData.map(d => d.total_revenue),
      borderColor: 'rgb(59, 130, 246)', 
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true, 
      tension: 0.4, 
      pointBackgroundColor: 'rgb(59, 130, 246)',
    }],
  };
  
  const barChartData = useMemo(() => {
    const allDatasets = [
      { id: 'gov', label: REVENUE_SOURCES[0].label, data: filteredData.map(d => d.gov_thaibaht_filtered), backgroundColor: REVENUE_SOURCES[0].color },
      { id: 'herbal', label: REVENUE_SOURCES[1].label, data: filteredData.map(d => d.herbal_drug_filtered), backgroundColor: REVENUE_SOURCES[1].color },
      { id: 'uc', label: REVENUE_SOURCES[2].label, data: filteredData.map(d => d.uc_point_baht), backgroundColor: REVENUE_SOURCES[2].color },
    ];
    return {
      labels: chartLabels,
      datasets: allDatasets.filter(ds => activeSources[ds.id as keyof typeof activeSources]),
    };
  }, [filteredData, activeSources, chartLabels]);

  const barChartOptions = {
    ...commonChartOptions,
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
    plugins: {
      legend: {
        display: false,
      }
    }
  };

  const handleSourceToggle = (sourceId: string) => {
    setActiveSources(prev => ({ ...prev, [sourceId]: !prev[sourceId] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-gray-600">กำลังเตรียมข้อมูลภาพรวม...</p>
        </div>
      </div>
    );
  }

  if (error) return <div className="flex h-screen items-center justify-center text-red-500">เกิดข้อผิดพลาด: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Header
        fiscalYears={fiscalYears}
        selectedFiscalYear={selectedFiscalYear}
        onYearChange={setSelectedFiscalYear}
        pointRate={pointRate}
        onPointRateChange={setPointRate}
      />
      
      <SourceFilter
        sources={REVENUE_SOURCES}
        activeSources={activeSources}
        onSourceToggle={handleSourceToggle}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <KpiCard icon={<CircleDollarSign />} title="รายได้รวม" value={`฿${summary.total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <KpiCard icon={<TrendingUp />} title="รายได้เฉลี่ย/เดือน" value={`฿${summary.avg.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <KpiCard 
          icon={<CalendarDays />} 
          title="เดือนรายได้สูงสุด" 
          value={summary.maxMonth ? new Date(summary.maxMonth).toLocaleDateString('th-TH', { month: 'long' }) : 'N/A'} 
          subValue={summary.maxMonthValue > 0 ? `฿${summary.maxMonthValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : ''} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
            <ChartContainer title="แนวโน้มรายได้รวม (รายเดือน)">
                <Line data={lineChartData} options={commonChartOptions} />
            </ChartContainer>
        </div>
        <div className="lg:col-span-2">
            <ChartContainer title="สัดส่วนรายได้">
                <Bar data={barChartData} options={barChartOptions} />
            </ChartContainer>
        </div>
      </div>
    </div>
  );
}

// Updated KpiCard component
function KpiCard({ icon, title, value, subValue }: { icon: React.ReactNode, title: string, value: string, subValue?: string }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-start gap-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                {subValue && <p className="text-sm text-gray-400 mt-1">{subValue}</p>}
            </div>
        </div>
    );
}