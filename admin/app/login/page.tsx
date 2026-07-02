'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '../../lib/api';
import { Bike, ShieldAlert, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminAPI.login(email, password);
      const { token } = response.data;
      
      localStorage.setItem('admin_token', token);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="bg-[#141414]/80 backdrop-blur-xl border border-[rgba(255,107,0,0.15)] w-full max-w-md rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Header/Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3 shadow-[0_4px_20px_rgba(255,107,0,0.3)]">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest">ROVER</h1>
          <p className="text-xs text-muted-foreground mt-1">Administrative Portal Access</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@rover.com"
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[rgba(255,107,0,0.1)] rounded-lg text-white placeholder-muted-foreground/40 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[rgba(255,107,0,0.1)] rounded-lg text-white placeholder-muted-foreground/40 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-lg shadow-[0_4px_20px_rgba(255,107,0,0.2)] hover:shadow-[0_4px_25px_rgba(255,107,0,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
