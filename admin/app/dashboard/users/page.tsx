'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/api';
import { Search, Ban, CheckCircle, Eye } from 'lucide-react';

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => adminAPI.getUsers({ search: search || undefined, role: roleFilter || undefined }).then(r => r.data),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'suspend' | 'unsuspend' }) =>
      action === 'suspend' ? adminAPI.suspendUser(id, 'Admin action') : adminAPI.unsuspendUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Users</h1>
          <p className="text-muted-foreground mt-1">{data?.total || 0} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-surface border border-[rgba(255,107,0,0.2)] rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-muted-foreground text-sm focus:outline-none focus:border-primary"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-surface border border-[rgba(255,107,0,0.2)] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="owner">Owners</option>
          <option value="rider">Riders</option>
          <option value="tripPartner">Trip Partners</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,107,0,0.1)]">
              {['Name', 'Phone', 'Role', 'City', 'Trust Score', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-white/5 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              data?.users?.map((user: any) => (
                <tr key={user._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                        {user.name?.[0]}
                      </div>
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{user.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'rider' ? 'bg-purple-500/20 text-purple-400' :
                      user.role === 'owner' ? 'bg-primary/20 text-primary' :
                      user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{user.city || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden" style={{ width: 60 }}>
                        <div className="h-full bg-primary rounded-full" style={{ width: `${user.trustScore || 0}%` }} />
                      </div>
                      <span className="text-white text-xs font-semibold">{user.trustScore || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.suspended ? 'bg-red-500/20 text-red-400' : 'bg-success/20 text-success'}`}>
                      {user.suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className={`p-1.5 rounded-lg transition-colors ${user.suspended ? 'bg-success/10 hover:bg-success/20 text-success' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'}`}
                        onClick={() => suspendMutation.mutate({ id: user._id, action: user.suspended ? 'unsuspend' : 'suspend' })}
                      >
                        {user.suspended ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
