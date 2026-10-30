'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, ArrowLeft, Type, Plus, Trash2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

function EpisodeGraphicsContent({ params }) {
  const unwrappedParams = use(params);
  const episodeId = unwrappedParams.id;
  const router = useRouter();

  const [lowerThirds, setLowerThirds] = useState([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchGraphics = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/lower-thirds`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch lower thirds.');
      setLowerThirds(data.lowerThirds || []);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Unauthorized') || err.message.includes('token')) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!episodeId) return;

    let isMounted = true;

    const loadGraphics = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/lower-thirds`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch lower thirds.');
        
        if (isMounted) {
          setLowerThirds(data.lowerThirds || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          if (err.message.includes('Unauthorized') || err.message.includes('token')) {
            localStorage.removeItem('token');
            router.push('/login');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGraphics();

    return () => {
      isMounted = false;
    };
  }, [episodeId, router]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/lower-thirds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, subtitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create graphic.');

      setTitle('');
      setSubtitle('');
      fetchGraphics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lower-thirds/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle graphic.');
      fetchGraphics();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lower third?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lower-thirds/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete graphic.');
      fetchGraphics();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/studio/${episodeId}`)} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Radio className="w-5 h-5 text-rose-500" />
          <span className="font-bold text-white text-lg">Branded Lower Thirds & Graphics</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create Lower Third Form */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 h-fit">
          <h2 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
            <Type className="w-4 h-4 text-rose-500" />
            <span>Create Lower Third</span>
          </h2>

          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Primary Title / Name</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Oluwajuwonlo Emmanuel"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Subtitle / Role</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Lead Consultant & Host"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Save Lower Third'}
            </button>
          </form>
        </div>

        {/* Lower Thirds List & Preview */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-semibold text-white text-base mb-2">Episode Graphics</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : lowerThirds.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-sm">
              No lower thirds created for this episode yet.
            </div>
          ) : (
            <div className="space-y-3">
              {lowerThirds.map((lt) => (
                <div key={lt.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white text-sm">{lt.title}</h3>
                      {lt.is_active && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                          <CheckCircle2 className="w-3 h-3" /> LIVE ON AIR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{lt.subtitle || 'No subtitle'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(lt.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        lt.is_active ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {lt.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{lt.is_active ? 'Hide' : 'Show Live'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(lt.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
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

export default function EpisodeGraphicsPage({ params }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    }>
      <EpisodeGraphicsContent params={params} />
    </Suspense>
  );
}