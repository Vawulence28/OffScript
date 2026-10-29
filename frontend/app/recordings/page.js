'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, ArrowLeft, Video, Download, Trash2, Clock, CheckCircle2, Play } from 'lucide-react';

export default function RecordingsLibraryPage() {
  const router = useRouter();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecordings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recordings`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch recordings.');
      setRecordings(data.recordings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recordings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete recording.');
      setRecordings(recordings.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Radio className="w-5 h-5 text-rose-500" />
          <span className="font-bold text-white text-lg">Recording Library</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">Broadcast Recordings</h1>
          <p className="text-sm text-zinc-400 mt-1">Access, replay, and download completed OffScript broadcast recordings.</p>
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
        ) : recordings.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
            <Video className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="font-semibold text-white text-lg">No recordings available</h3>
            <p className="text-zinc-400 text-sm mt-1">Recordings appear here after completing a live broadcast.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recordings.map((rec) => (
              <div key={rec.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white text-lg">{rec.episode_title}</h3>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> READY
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Recorded on: {new Date(rec.created_at).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={rec.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-all shadow"
                  >
                    <Play className="w-4 h-4" />
                    <span>Replay</span>
                  </a>
                  <a
                    href={rec.file_url}
                    download
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"
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