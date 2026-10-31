'use client';

import { useEffect, useState, useRef, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { Radio, MessageSquare, Send, Clock } from 'lucide-react';

function PublicWatchContent({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const router = useRouter();

  const [episode, setEpisode] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const socketRef = useRef(null);
  const publicVideoRef = useRef(null);
  const audiencePCRef = useRef(null);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/episodes/${slug}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load live session.');
        if (isMounted) setEpisode(data.episode);

        return fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${data.episode.id}/comments`);
      })
      .then(async (res) => {
        if (res && res.ok && isMounted) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!episode?.id) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.emit('join-audience', episode.id);
    socket.emit('request-broadcast-stream', episode.id);

    socket.on('new-comment', (comment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    });

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
    });
    audiencePCRef.current = pc;

    pc.ontrack = (event) => {
      if (publicVideoRef.current && event.streams && event.streams[0]) {
        publicVideoRef.current.srcObject = event.streams[0];
        publicVideoRef.current.play().catch((e) => console.log('Audience video play error:', e));
      }
    };

    socket.on('broadcast-offer', async (offer) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('broadcast-answer', { episodeId: episode.id, answer });
    });

    socket.on('broadcast-ice', async (candidate) => {
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error(e);
        }
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (audiencePCRef.current) audiencePCRef.current.close();
    };
  }, [episode?.id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !displayName.trim() || !episode?.id) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episode.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, message: newComment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post comment.');

      if (data.comment && !comments.some((c) => c.id === data.comment.id)) {
        setComments((prev) => [...prev, data.comment]);
      }
      setNewComment('');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
        <Radio className="w-12 h-12 text-rose-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2">Session Not Found</h2>
        <p className="text-xs text-zinc-500 max-w-sm mb-6">{error || 'This session is unavailable.'}</p>
        <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-white text-lg block leading-none">OFFSCRIPT</span>
            <span className="text-[10px] text-zinc-500 tracking-widest uppercase">Live Audience View</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>{episode.status === 'PUBLISHED' ? 'LIVE NOW' : 'SCHEDULED'}</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl">
            {episode.status === 'PUBLISHED' ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-center relative">
                <video ref={publicVideoRef} autoPlay playsInline muted={false} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-zinc-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>Live Studio Stream</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-center p-6 space-y-3">
                <Clock className="w-10 h-10 text-zinc-600" />
                <h3 className="text-white font-bold text-base">This Session Has Not Started Yet</h3>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{episode.title}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">{episode.description}</p>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-[600px]">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              <span>Live Audience Chat</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{comments.length} comments</span>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 my-2 pr-1">
            {comments.map((c, i) => (
              <div key={c.id || i} className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-rose-400">{c.display_name}</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed">{c.message}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handlePostComment} className="pt-3 border-t border-zinc-800 space-y-2">
            <input
              type="text"
              required
              placeholder="Your name or handle..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                required
                maxLength={500}
                placeholder="Share your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
              />
              <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function PublicWatchPage({ params }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading watch stream...</div>}>
      <PublicWatchContent params={params} />
    </Suspense>
  );
}