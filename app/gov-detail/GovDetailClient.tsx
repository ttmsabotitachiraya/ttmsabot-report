// app/gov-detail/GovDetailClient.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  ArcElement 
} from 'chart.js';
import { Users, FileText, CircleDollarSign, Loader2 } from 'lucide-react';
import { getFiscalYear } from '@/utils/helpers';
import LoadingSpinner from '@/app/components/LoadingSpinner'; 

// ลงทะเบียน components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement);

// Interfaces
interface GovRawData {
  vstdate: Date;
  cid: string;
  pttype_name: string;
  item_list: string;
  total_price: number;
}

// Reusable components
const KpiCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex items-start gap-4">
      <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">{icon}</div>
      <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
  </div>
);

const ChartContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">{title}</h3>
      <div className="h-80 relative">{children}</div>
  </div>
);

export default function GovDetailClient() {
  const [allData, setAllData] = useState<GovRawData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(null);
  const [selectedPttype, setSelectedPttype] = useState<string>('all');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_GAS_API_URL}?page=gov_detail`;
        const response = await axios.get(apiUrl);
        if (response.data?.success) {
          const data: GovRawData[] = response.data.data.map((d: any) => ({
              ...d,
              vstdate: new Date(d.vstdate)
          }));
          setAllData(data);
          if (data.length > 0) {
            const latestYear = Math.max(...data.map((d) => getFiscalYear(d.vstdate)));
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

  // Process data
  const processedData = useMemo(() => {
    if (!allData.length || !selectedFiscalYear) {
      return {
        fiscalYears: [], pttypes: [],
        kpis: { totalRevenue: 0, totalVisits: 0, uniquePatients: 0, revenuePerVisit: 0 },
        comboChartData: { labels: [], revenue: [], patients: [] },
        donutChartData: { labels: [], data: [] },
        barChartData: { labels: [], data: [] },
      };
    }
    const fiscalYears = [...new Set(allData.map(d => getFiscalYear(d.vstdate)))].sort((a, b) => b - a);
    const pttypes = ['all', ...new Set(allData.map(d => d.pttype_name))];
    let filteredByYear = allData.filter(d => getFiscalYear(d.vstdate) === selectedFiscalYear);
    let fullyFiltered = selectedPttype === 'all' ? filteredByYear : filteredByYear.filter(d => d.pttype_name === selectedPttype);

    // KPIs
    const totalRevenue = fullyFiltered.reduce((sum, item) => sum + item.total_price, 0);
    const totalVisits = fullyFiltered.length;
    const uniquePatients = new Set(fullyFiltered.map(d => d.cid)).size;
    const revenuePerVisit = totalVisits > 0 ? totalRevenue / totalVisits : 0;

    // Combo Chart
    const monthlyData: { [key: string]: { revenue: number, patientCids: Set<string> } } = {};
    filteredByYear.forEach(d => {
        const monthKey = d.vstdate.toLocaleString('th-TH', { month: 'short' });
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, patientCids: new Set() };
        monthlyData[monthKey].revenue += d.total_price;
        monthlyData[monthKey].patientCids.add(d.cid);
    });
    const monthOrder = ["ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย."];
    const comboLabels = Object.keys(monthlyData).sort((a,b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

    // Donut Chart
    const pttypeRevenue: { [key: string]: number } = {};
    filteredByYear.forEach(d => { pttypeRevenue[d.pttype_name] = (pttypeRevenue[d.pttype_name] || 0) + d.total_price; });

    // Bar Chart (Top 5 Drugs)
    const drugCounts: { [key: string]: number } = {};
    const serviceKeywords = ["นวด", "ประคบ", "อบ", "ฟื้นฟู"];
    fullyFiltered.forEach(d => {
        const items = d.item_list.split(',').map(item => item.replace(/^\d+/, '').trim());
        items.forEach(item => {
            if (item && !serviceKeywords.some(keyword => item.includes(keyword))) {
                drugCounts[item] = (drugCounts[item] || 0) + 1;
            }
        });
    });
    const topDrugs = Object.entries(drugCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

    return {
      fiscalYears, pttypes,
      kpis: { totalRevenue, totalVisits, uniquePatients, revenuePerVisit },
      comboChartData: { labels: comboLabels, revenue: comboLabels.map(m => monthlyData[m].revenue), patients: comboLabels.map(m => monthlyData[m].patientCids.size) },
      donutChartData: { labels: Object.keys(pttypeRevenue), data: Object.values(pttypeRevenue) },
      barChartData: { labels: topDrugs.map(([name]) => name), data: topDrugs.map(([, count]) => count) },
    };
  }, [allData, selectedFiscalYear, selectedPttype]);


  // 3. Prepare Chart.js data objects
  const comboChart = {
      labels: processedData.comboChartData.labels,
      datasets: [
        { type: 'bar' as const, label: 'รายได้รวม', yAxisID: 'y', data: processedData.comboChartData.revenue, backgroundColor: 'rgba(59, 130, 246, 0.6)' },
        { type: 'line' as const, label: 'จำนวนผู้ป่วย (คน)', yAxisID: 'y1', data: processedData.comboChartData.patients, borderColor: 'rgb(20, 184, 166)', backgroundColor: 'rgba(20, 184, 166, 0.2)', fill: true, tension: 0.3 }
      ]
  };
  const donutChart = {
      labels: processedData.donutChartData.labels,
      datasets: [{
          data: processedData.donutChartData.data,
          backgroundColor: ['rgb(59, 130, 246)', 'rgb(99, 102, 241)', 'rgb(139, 92, 246)'],
          hoverOffset: 4
      }]
  };
  const barChart = {
      labels: processedData.barChartData.labels,
      datasets: [{ label: 'จำนวนครั้งที่ให้บริการ', data: processedData.barChartData.data, backgroundColor: 'rgba(59, 130, 246, 0.8)' }]
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) return <div className="p-8 text-red-500">เกิดข้อผิดพลาด: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header & Filters */}
      <header className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">วิเคราะห์รายได้สิทธิข้าราชการ</h1>
          <p className="text-gray-500">ข้อมูลปีงบประมาณ {selectedFiscalYear || 'N/A'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <select value={selectedFiscalYear || ''} onChange={e => setSelectedFiscalYear(Number(e.target.value))} 
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200">
                {processedData.fiscalYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selectedPttype} onChange={e => setSelectedPttype(e.target.value)} 
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200">
                {processedData.pttypes.map(p => <option key={p} value={p}>{p === 'all' ? 'ทุกประเภทสิทธิ' : p}</option>)}
            </select>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard icon={<CircleDollarSign/>} title="รายได้รวม" value={`฿${processedData.kpis.totalRevenue.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`} />
        <KpiCard icon={<FileText/>} title="จำนวนครั้งที่รับบริการ" value={processedData.kpis.totalVisits.toLocaleString('th-TH')} />
        <KpiCard icon={<Users/>} title="จำนวนผู้ป่วย (คน)" value={processedData.kpis.uniquePatients.toLocaleString('th-TH')} />
        <KpiCard icon={<CircleDollarSign/>} title="รายได้เฉลี่ย/ครั้ง" value={`฿${processedData.kpis.revenuePerVisit.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`} />
      </div>
      
      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="ภาพรวมรายได้และจำนวนผู้ป่วยรายเดือน">
            {/* แก้ไขตรงนี้: ใส่ as any เพื่อ bypass type check สำหรับ Combo Chart */}
            <Line 
                data={comboChart as any} 
                options={{ 
                    scales: { 
                        y: { type: 'linear', display: true, position: 'left' }, 
                        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } } 
                    } 
                }} 
            />
        </ChartContainer>
        <ChartContainer title="สัดส่วนรายได้ตามประเภทสิทธิ">
            <Doughnut data={donutChart} options={{ maintainAspectRatio: false }} />
        </ChartContainer>
        <div className="lg:col-span-2">
            <ChartContainer title="5 อันดับยาสมุนไพรที่จ่าย (สิทธิข้าราชการ)">
                <Bar data={barChart} options={{ indexAxis: 'y' }} />
            </ChartContainer>
        </div>
      </div>
    </div>
  );
}