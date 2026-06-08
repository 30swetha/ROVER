'use client';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const MOCK_REVENUE = [
  { month: 'Aug', revenue: 45000, riders: 12 },
  { month: 'Sep', revenue: 68000, riders: 18 },
  { month: 'Oct', revenue: 52000, riders: 15 },
  { month: 'Nov', revenue: 89000, riders: 24 },
  { month: 'Dec', revenue: 112000, riders: 31 },
  { month: 'Jan', revenue: 145000, riders: 42 },
];

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminAPI.getAnalytics().then(r => r.data),
  });

  const userGrowth = data?.userGrowth || [];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-white">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform performance metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Revenue by Month</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MOCK_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '8px' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#FF6B00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Daily User Registrations</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={userGrowth.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="_id" tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rider Performance */}
        <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Active Riders Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MOCK_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '8px' }} />
              <Bar dataKey="riders" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Key Metrics</h2>
          <div className="space-y-4">
            {[
              { label: 'Avg Transport Distance', value: '485 km' },
              { label: 'Avg Rider Rating', value: '4.6 / 5.0' },
              { label: 'Payment Success Rate', value: '98.2%' },
              { label: 'Avg Response Time', value: '23 min' },
              { label: 'Rider Retention Rate', value: '78%' },
              { label: 'Avg Trip Duration', value: '2.3 days' },
            ].map(metric => (
              <div key={metric.label} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground text-sm">{metric.label}</span>
                <span className="text-white font-bold">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
