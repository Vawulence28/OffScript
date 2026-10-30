'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, LogOut, Shield, Calendar, PlusCircle, Settings, Video, Users, Layers, Play } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    // Verify Bearer Token Authentication & Fetch Episodes
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).then(async (res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch episodes');
        return res.json();
      }),
    ])
      .then(([authData, epData]) => {
        setUser(authData.user);
        setEpisodes(epData.episodes || epData || []);
      })
      .catch((err) => {
        console.error('Dashboard authentication error:', err);
        localStorage.removeItem('token');
        router.push('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-lg">OffScript</span>
            <span className="text-xs uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded ml-2 font-semibold">Studio Control</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>{user?.full_name || 'Host'}</span>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-sm transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Host Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage your live episodes, phone camera pairing, speakers, and broadcasts.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/recordings')}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium rounded-lg text-sm transition-all"
            >
              <Video className="w-4 h-4 text-rose-500" />
              <span>Recordings Library</span>
            </button>
            <button
              onClick={() => router.push('/episodes/new')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-sm transition-all shadow-lg shadow-rose-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Episode</span>
            </button>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div onClick={() => router.push('/episodes')} className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-6 cursor-pointer transition-all">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-rose-500 mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Episodes ({episodes.length})</h3>
            <p className="text-sm text-zinc-400">Create, schedule, and publish podcast episodes.</p>
          </div>

          <div onClick={() => router.push('/recordings')} className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-6 cursor-pointer transition-all">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-rose-500 mb-4">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Recording Library</h3>
            <p className="text-sm text-zinc-400">Replay, download, and manage completed show recordings.</p>
          </div>

          <div onClick={() => router.push('/settings')} className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-6 cursor-pointer transition-all">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-rose-500 mb-4">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Studio Settings</h3>
            <p className="text-sm text-zinc-400">Manage studio branding, auto-record, and security defaults.</p>
          </div>
        </div>

        {/* Recent Episodes Table / List */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-white text-lg">Active & Recent Episodes</h2>
            <button onClick={() => router.push('/episodes')} className="text-xs text-rose-500 hover:underline">View All</button>
          </div>

          {episodes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">No episodes found. Create your first episode to get started.</div>
          ) : (
            <div className="space-y-3">
              {episodes.slice(0, 5).map((ep) => (
                <div key={ep.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-white text-sm">{ep.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">{ep.status}</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{ep.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/studio/${ep.id}`)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-all"
                    >
                      Open Studio
                    </button>
                    <button
                      onClick={() => router.push(`/episodes/${ep.id}/speakers`)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" /> Speakers
                    </button>
                    <button
                      onClick={() => router.push(`/episodes/${ep.id}/graphics`)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" /> Graphics
                    </button>
                    <button
                      onClick={() => router.push(`/episodes/${ep.id}/youtube`)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-red-400 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                      title="YouTube Live Settings"
                    >
                      <Video className="w-3.5 h-3.5 text-red-500" /> YouTube
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}