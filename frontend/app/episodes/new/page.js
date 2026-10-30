'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function NewEpisodePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [scheduledFor, setScheduledFor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          cover_image_url: coverImageUrl,
          status,
          scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create episode.');

      router.push('/episodes');
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/episodes')} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold tracking-tight text-white text-lg">Create New Episode</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-8">
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Episode Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ep 12: Building AI Agents with Node.js"
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a summary or show notes for this episode..."
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-rose-500 text-sm"
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-rose-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => router.push('/episodes')}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Episode</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}