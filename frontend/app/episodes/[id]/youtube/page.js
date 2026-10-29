'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, ArrowLeft, Video, Save, CheckCircle2, ShieldAlert, Key, Globe, ToggleLeft, ToggleRight } from 'lucide-react';

function YouTubeDestinationContent({ params }) {
  const unwrappedParams = use(params);
  const episodeId = unwrappedParams.id;
  const router = useRouter();

  const [streamUrl, setStreamUrl] = useState('rtmp://a.rtmp.youtube.com/live2');
  const [streamKey, setStreamKey] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('IDLE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!episodeId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/youtube`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.destination) {
          setStreamUrl(data.destination.stream_url || 'rtmp://a.rtmp.youtube.com/live2');
          setIsActive(data.destination.is_active);
          setStatus(data.destination.status);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [episodeId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          stream_url: streamUrl,
          stream_key: streamKey,
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update YouTube settings.');

      setSuccess('YouTube Live destination updated successfully.');
      setIsActive(data.destination.is_active);
      setStatus(data.destination.status);
      setStreamKey(''); // Clear sensitive key field from UI memory
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/studio/${episodeId}`)} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Radio className="w-5 h-5 text-rose-500" />
          <span className="font-bold text-white text-lg">Optional YouTube Live Integration</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Video className="w-7 h-7 text-red-500" />
            <h1 className="text-2xl font-bold text-white">YouTube Live Destination</h1>
          </div>
          <p className="text-sm text-zinc-400">
            Simultaneously broadcast this episode to YouTube Live alongside the independent OffScript website stream.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 flex items-center gap-3 text-rose-400 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-white text-sm">Enable YouTube Live Egress</h3>
              <p className="text-xs text-zinc-400">When enabled, OffScript will relay your live studio feed to YouTube Live when you click "Go Live".</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="text-rose-500 hover:text-rose-400 transition-colors"
            >
              {isActive ? <ToggleRight className="w-10 h-10 text-rose-500" /> : <ToggleLeft className="w-10 h-10 text-zinc-600" />}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              YouTube RTMP Server URL
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Globe className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              YouTube Stream Key
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder={isActive ? "•••••••••••••••• (Key Saved)" : "Paste YouTube Stream Key"}
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Find your stream key in your YouTube Live Control Room under <em>Stream Settings</em>. Stream keys are encrypted and never exposed in public client views.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save YouTube Destination</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function YouTubeDestinationPage({ params }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    }>
      <YouTubeDestinationContent params={params} />
    </Suspense>
  );
}