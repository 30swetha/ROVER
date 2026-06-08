'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/api';
import { CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import Image from 'next/image';

type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'reupload';

const STATUS_STYLES: Record<VerificationStatus, string> = {
  pending: 'bg-warning/20 text-warning',
  approved: 'bg-success/20 text-success',
  rejected: 'bg-destructive/20 text-destructive',
  reupload: 'bg-blue-500/20 text-blue-400',
};

export default function RidersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<VerificationStatus>('pending');
  const [notes, setNotes] = useState('');
  const [selectedRider, setSelectedRider] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-riders', statusFilter],
    queryFn: () => adminAPI.getRiders({ status: statusFilter }).then(r => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      adminAPI.verifyRider(id, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-riders'] });
      setSelectedRider(null);
      setNotes('');
    },
  });

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Rider Verification</h1>
          <p className="text-muted-foreground mt-1">Review and approve KYC documents</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'reupload'] as VerificationStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-surface border border-[rgba(255,107,0,0.2)] text-muted-foreground hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* List */}
        <div className="col-span-1 space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-4 animate-pulse">
                <div className="h-4 w-32 bg-white/5 rounded mb-2" />
                <div className="h-3 w-24 bg-white/5 rounded" />
              </div>
            ))
          ) : (
            data?.riders?.map((rider: any) => (
              <button
                key={rider._id}
                onClick={() => setSelectedRider(rider)}
                className={`w-full text-left bg-surface border rounded-xl p-4 transition-all hover:border-primary/50 ${
                  selectedRider?._id === rider._id ? 'border-primary' : 'border-[rgba(255,107,0,0.1)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {rider.userId?.name?.[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{rider.userId?.name}</p>
                    <p className="text-muted-foreground text-xs">{rider.userId?.phone}</p>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[rider.verificationStatus as VerificationStatus]}`}>
                    {rider.verificationStatus}
                  </span>
                </div>
              </button>
            ))
          )}
          {!isLoading && !data?.riders?.length && (
            <p className="text-muted-foreground text-center py-8">No riders with {statusFilter} status</p>
          )}
        </div>

        {/* Detail panel */}
        <div className="col-span-2">
          {selectedRider ? (
            <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedRider.userId?.name}</h2>
                  <p className="text-muted-foreground">{selectedRider.userId?.phone} • {selectedRider.userId?.city}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_STYLES[selectedRider.verificationStatus as VerificationStatus]}`}>
                  {selectedRider.verificationStatus}
                </span>
              </div>

              {/* Documents */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Driving License', url: selectedRider.licenseUrl },
                  { label: 'Aadhaar Card', url: selectedRider.aadhaarUrl },
                  { label: 'Selfie', url: selectedRider.selfieUrl },
                ].map(doc => (
                  <div key={doc.label} className="space-y-2">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{doc.label}</p>
                    {doc.url ? (
                      <div className="relative group">
                        <img src={doc.url} alt={doc.label} className="w-full h-32 object-cover rounded-lg border border-[rgba(255,107,0,0.2)]" />
                        <a href={doc.url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-white/5 rounded-lg flex items-center justify-center border border-[rgba(255,107,0,0.1)]">
                        <p className="text-muted-foreground text-xs">Not uploaded</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Document numbers */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">License Number</p>
                  <p className="text-white font-mono">{selectedRider.licenseNumber || 'Not provided'}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Aadhaar Number</p>
                  <p className="text-white font-mono">{selectedRider.aadhaarNumber || 'Not provided'}</p>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 block">Notes (optional)</label>
                <textarea
                  className="w-full bg-black/20 border border-[rgba(255,107,0,0.2)] rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-primary"
                  rows={3}
                  placeholder="Add notes for the rider..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => verifyMutation.mutate({ id: selectedRider.userId._id, status: 'approved', notes })}
                  className="flex items-center gap-2 bg-success/20 hover:bg-success/30 text-success border border-success/30 px-4 py-2.5 rounded-lg font-semibold transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => verifyMutation.mutate({ id: selectedRider.userId._id, status: 'rejected', notes })}
                  className="flex items-center gap-2 bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30 px-4 py-2.5 rounded-lg font-semibold transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => verifyMutation.mutate({ id: selectedRider.userId._id, status: 'reupload', notes })}
                  className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-4 py-2.5 rounded-lg font-semibold transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Request Reupload
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-8 flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <p className="text-white font-semibold">Select a rider to review</p>
                <p className="text-muted-foreground text-sm mt-1">Click on a rider from the list to view their documents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
