'use client';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/api';

export default function RequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: () => adminAPI.getRequests({ limit: 50 }).then(r => r.data),
  });

  const STATUS_COLORS: Record<string, string> = {
    open: 'bg-primary/20 text-primary',
    inProgress: 'bg-warning/20 text-warning',
    completed: 'bg-success/20 text-success',
    cancelled: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Transport Requests</h1>
        <p className="text-muted-foreground mt-1">{data?.total || 0} total requests</p>
      </div>

      <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,107,0,0.1)]">
              {['Route', 'Bike', 'Owner', 'Budget', 'Date', 'Status', 'Applicants'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-white/5 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : (
              data?.requests?.map((req: any) => (
                <tr key={req._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{req.pickupCity}</span>
                    <span className="text-muted-foreground mx-2">→</span>
                    <span className="text-white font-semibold">{req.destinationCity}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{req.bikeBrand} {req.bikeModel}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{req.ownerId?.name}</td>
                  <td className="px-4 py-3 text-primary font-semibold">₹{req.budget?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {new Date(req.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status] || ''}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{req.applicants?.length || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
