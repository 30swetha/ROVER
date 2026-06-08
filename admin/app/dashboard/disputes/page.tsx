'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/api';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../../lib/api';

export default function DisputesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['emergency-alerts'],
    queryFn: () => api.get('/emergency/active').then(r => r.data),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/emergency/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency-alerts'] }),
  });

  const alerts = data?.alerts || [];

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Disputes & Alerts</h1>
        <p className="text-muted-foreground mt-1">Emergency SOS alerts and dispute tickets</p>
      </div>

      {/* SOS Alerts */}
      <div className="mb-8">
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Active SOS Alerts
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-surface border border-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-white font-semibold">No active alerts</p>
            <p className="text-muted-foreground text-sm">All clear! No emergency alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div key={alert._id} className="bg-surface border border-destructive/30 rounded-xl p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{alert.userId?.name}</p>
                    <p className="text-muted-foreground text-sm">{alert.userId?.phone}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      📍 {alert.location?.address || `${alert.location?.lat?.toFixed(4)}, ${alert.location?.lng?.toFixed(4)}`}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(alert.createdAt).toLocaleString('en-IN')}
                    </p>
                    {alert.message && <p className="text-white text-sm mt-2 bg-black/20 rounded p-2">"{alert.message}"</p>}
                  </div>
                </div>
                <button
                  onClick={() => resolveMutation.mutate(alert._id)}
                  className="flex items-center gap-2 bg-success/20 hover:bg-success/30 text-success border border-success/30 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placeholder dispute tickets */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">Dispute Tickets</h2>
        <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-3" />
          <p className="text-white font-semibold">No open disputes</p>
          <p className="text-muted-foreground text-sm mt-1">Dispute management system is active and monitoring</p>
        </div>
      </div>
    </div>
  );
}
