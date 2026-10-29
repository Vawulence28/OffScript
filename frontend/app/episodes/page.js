'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Plus, Calendar, Edit3, Trash2, ArrowLeft, Clock, CheckCircle2, Archive, FileText } from 'lucide-react';

export default function EpisodesDashboard() {
  const router = useRouter();
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const fetchEpisodes = async (statusFilter = '') => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/episodes`;
      if (statusFilter) url += `?status=${statusFilter}`;

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch episodes.');
      setEpisodes(data.episodes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEpisodes(filter);
  }, [filter]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete episode.');
      setEpisodes(episodes.filter((ep) => ep.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Published</span>;
      case 'SCHEDULED':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20"><Clock className="w-3.5 h-3.5" /> Scheduled</span>;
      case 'ARCHIVED':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"><Archive className="w-3.5 h-3.5" /> Archived</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><FileText className="w-3.5 h-3.5" /> Draft</span>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <Radio className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-white text-lg">Episode Management</span>
        </div>
        <button
          onClick={() => router.push('/episodes/new')}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-sm transition-all shadow-lg shadow-rose-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Episode</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Podcast Episodes</h1>
            <p className="text-sm text-zinc-400 mt-1">Create, schedule, publish, and manage your broadcast episodes.</p>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
            {['', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === st ? 'bg-rose-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {st || 'All'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="font-semibold text-white text-lg">No episodes found</h3>
            <p className="text-zinc-400 text-sm mt-1 mb-6">Get started by creating your first podcast episode.</p>
            <button
              onClick={() => router.push('/episodes/new')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-sm transition-all"
            >
              Create Episode
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-white">{ep.title}</h3>
                    {getStatusBadge(ep.status)}
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2">{ep.description || 'No description provided.'}</p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Slug: <code className="text-zinc-400">{ep.slug}</code></span>
                    {ep.scheduled_for && (
                      <span>Scheduled: {new Date(ep.scheduled_for).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => router.push(`/episodes/${ep.id}/edit`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(ep.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}