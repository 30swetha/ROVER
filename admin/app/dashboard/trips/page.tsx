'use client';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/api';

export default function TripsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-trips'],
    queryFn: () => adminAPI.getTrips({ limit: 50 }).then(r => r.data),
  });

  const STATUS_COLORS: Record<string, string> = {
    open: 'bg-primary/20 text-primary',
    full: 'bg-warning/20 text-warning',
    ongoing: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-success/20 text-success',
    cancelled: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Group Trips</h1>
        <p className="text-muted-foreground mt-1">{data?.total || 0} total trips</p>
      </div>

      <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,107,0,0.1)]">
              {['Title', 'Route', 'Creator', 'Date', 'Riders', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-white/5 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : data?.trips?.map((trip: any) => (
              <tr key={trip._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 text-white font-semibold">{trip.title}</td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground">{trip.startCity}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span className="text-muted-foreground">{trip.destination}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-sm">{trip.creatorId?.name}</td>
                <td className="px-4 py-3 text-muted-foreground text-sm">
                  {new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-white text-sm">{trip.currentRiders?.length || 0}/{trip.maxRiders}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[trip.status] || ''}`}>{trip.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
