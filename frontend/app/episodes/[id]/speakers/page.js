'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, ArrowLeft, UserPlus, Trash2, CheckCircle2, Clock, ShieldAlert, Users, Copy } from 'lucide-react';

function EpisodeSpeakersContent({ params }) {
  const unwrappedParams = use(params);
  const episodeId = unwrappedParams.id;
  const router = useRouter();

  const [invitations, setInvitations] = useState([]);
  const [speakerName, setSpeakerName] = useState('');
  const [speakerEmail, setSpeakerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchInvitations = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch invitations.');
      setInvitations(data.invitations || []);
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

    const loadInvitations = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/invitations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch invitations.');
        
        if (isMounted) {
          setInvitations(data.invitations || []);
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

    loadInvitations();
    const interval = setInterval(loadInvitations, 5000); // Poll waiting room every 5s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [episodeId, router]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ speaker_name: speakerName, speaker_email: speakerEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invitation.');

      setSpeakerName('');
      setSpeakerEmail('');
      fetchInvitations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const endpoint = action === 'admit' ? `/api/invitations/${id}/admit` : action === 'remove' ? `/api/invitations/${id}/remove` : `/api/invitations/${id}`;
      const method = action === 'revoke' ? 'DELETE' : 'POST';

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed.');
      fetchInvitations();
    } catch (err) {
      alert(err.message);
    }
  };

  const copyLink = (token) => {
    const link = `${window.location.origin}/speaker/join?token=${token}`;
    navigator.clipboard.writeText(link);
    alert('Speaker invitation link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/episodes')} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Radio className="w-5 h-5 text-rose-500" />
          <span className="font-bold text-white text-lg">Speaker Invitations & Waiting Room</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invite Form */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 h-fit">
          <h2 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-rose-500" />
            <span>Invite Speaker</span>
          </h2>

          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Speaker Name</label>
              <input
                type="text"
                required
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Speaker Email</label>
              <input
                type="email"
                required
                value={speakerEmail}
                onChange={(e) => setSpeakerEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {submitting ? 'Generating Link...' : 'Create Invite Link'}
            </button>
          </form>
        </div>

        {/* Invitations & Waiting Room List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-500" />
            <span>Episode Participants & Waiting Room</span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-sm">
              No speaker invitations created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white text-sm">{inv.speaker_name}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        inv.status === 'ADMITTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        inv.status === 'WAITING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{inv.speaker_email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(inv.token)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center gap-1.5"
                      title="Copy Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </button>

                    {inv.status === 'WAITING' && (
                      <button
                        onClick={() => handleAction(inv.id, 'admit')}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
                      >
                        Admit
                      </button>
                    )}

                    {inv.status === 'ADMITTED' && (
                      <button
                        onClick={() => handleAction(inv.id, 'remove')}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium"
                      >
                        Remove
                      </button>
                    )}

                    <button
                      onClick={() => handleAction(inv.id, 'revoke')}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                      title="Revoke"
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

export default function EpisodeSpeakersPage({ params }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    }>
      <EpisodeSpeakersContent params={params} />
    </Suspense>
  );
}