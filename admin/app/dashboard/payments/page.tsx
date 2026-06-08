'use client';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/api';
import { DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => adminAPI.getPayments({ limit: 50 }).then(r => r.data),
  });

  const payments = data?.payments || [];
  const totalRevenue = payments.filter((p: any) => p.status === 'released').reduce((sum: number, p: any) => sum + (p.platformFee || 0), 0);

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-warning/20 text-warning',
    escrowed: 'bg-blue-500/20 text-blue-400',
    released: 'bg-success/20 text-success',
    refunded: 'bg-muted text-muted-foreground',
    failed: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Payments</h1>
        <p className="text-muted-foreground mt-1">Transaction history and revenue</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-5">
          <DollarSign className="w-5 h-5 text-primary mb-2" />
          <p className="text-muted-foreground text-sm">Platform Revenue</p>
          <p className="text-white text-2xl font-black">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-5">
          <TrendingUp className="w-5 h-5 text-success mb-2" />
          <p className="text-muted-foreground text-sm">Total Processed</p>
          <p className="text-white text-2xl font-black">{payments.length}</p>
        </div>
        <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-5">
          <ArrowUpRight className="w-5 h-5 text-warning mb-2" />
          <p className="text-muted-foreground text-sm">In Escrow</p>
          <p className="text-white text-2xl font-black">
            ₹{payments.filter((p: any) => p.status === 'escrowed').reduce((s: number, p: any) => s + p.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,107,0,0.1)]">
              {['Route', 'Owner', 'Rider', 'Amount', 'Platform Fee', 'Status', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-white/5 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : payments.map((p: any) => (
              <tr key={p._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 text-white font-medium">
                  {p.requestId?.pickupCity} → {p.requestId?.destinationCity}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-sm">{p.ownerId?.name}</td>
                <td className="px-4 py-3 text-muted-foreground text-sm">{p.riderId?.name}</td>
                <td className="px-4 py-3 text-white font-semibold">₹{p.amount?.toLocaleString()}</td>
                <td className="px-4 py-3 text-primary font-semibold">₹{p.platformFee?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-sm">
                  {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
