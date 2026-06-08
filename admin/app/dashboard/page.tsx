'use client';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../lib/api';
import { StatsCard } from '../../components/StatsCard';
import { Users, Bike, Package, TrendingUp, DollarSign, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminAPI.getAnalytics().then(r => r.data),
  });

  const kpis = data?.kpis;
  const userGrowth = data?.userGrowth || [];

  const PIE_DATA = [
    { name: 'Open', value: kpis?.totalRequests - kpis?.activeRequests - kpis?.completedRequests || 30 },
    { name: 'Active', value: kpis?.activeRequests || 15 },
    { name: 'Completed', value: kpis?.completedRequests || 45 },
  ];
  const PIE_COLORS = ['#FF6B00', '#F59E0B', '#22C55E'];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">ROVER platform overview</p>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-5 animate-pulse">
              <div className="h-10 w-10 bg-white/5 rounded-lg mb-3" />
              <div className="h-3 w-20 bg-white/5 rounded mb-2" />
              <div className="h-6 w-16 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Users" value={kpis?.totalUsers || 0} icon={Users} trend={{ value: 12, positive: true }} />
          <StatsCard title="Active Riders" value={kpis?.totalRiders || 0} icon={Bike} color="text-purple-400" trend={{ value: 8, positive: true }} />
          <StatsCard title="Transport Requests" value={kpis?.totalRequests || 0} icon={Package} color="text-blue-400" />
          <StatsCard title="Platform Revenue" value={`₹${(kpis?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} color="text-success" trend={{ value: 23, positive: true }} />
          <StatsCard title="Active Requests" value={kpis?.activeRequests || 0} icon={Activity} color="text-warning" subtitle="Currently in progress" />
          <StatsCard title="Completed Trips" value={kpis?.completedRequests || 0} icon={CheckCircle} color="text-success" />
          <StatsCard title="Group Trips" value={kpis?.totalTrips || 0} icon={TrendingUp} color="text-pink-400" />
          <StatsCard title="New Users This Month" value={kpis?.newUsersThisMonth || 0} icon={Users} color="text-primary" trend={{ value: 5, positive: true }} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6">
        {/* User Growth */}
        <div className="col-span-2 bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">User Growth (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="_id" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="count" stroke="#FF6B00" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Request Status Pie */}
        <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Request Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                {PIE_DATA.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {PIE_DATA.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-white font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
