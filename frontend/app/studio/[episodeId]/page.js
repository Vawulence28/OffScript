'use client';

import { useEffect, useState, useRef, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { Radio, ArrowLeft, QrCode, Video, VideoOff, Mic, MicOff, Users, Play, Square, ShieldAlert, CheckCircle, Wifi } from 'lucide-react';

function StudioContent({ params }) {
  const unwrappedParams = use(params);
  const episodeId = unwrappedParams.episodeId;
  const router = useRouter();

  const [pairingUrl, setPairingUrl] = useState('');
  const [cameraConnected, setCameraConnected] = useState(false);
  const [admittedSpeakers, setAdmittedSpeakers] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [loadingBroadcast, setLoadingBroadcast] = useState(false);
  const [error, setError] = useState('');

  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);

  // Defined above useEffect to prevent hoisting / TDZ errors
  const fetchSpeakers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setAdmittedSpeakers((data.invitations || []).filter((i) => i.status === 'ADMITTED'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBroadcastStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/status/${episodeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok && data.session && data.session.status === 'LIVE') {
        setIsLive(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Initialize pairing & WebRTC
  useEffect(() => {
    if (!episodeId) return;

    let isMounted = true;

    const fetchSpeakers = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/invitations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (res.ok && isMounted) {
          setAdmittedSpeakers((data.invitations || []).filter((i) => i.status === 'ADMITTED'));
        }
      } catch (e) {
        console.error(e);
      }
    };

    const fetchBroadcastStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/status/${episodeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (res.ok && data.session && data.session.status === 'LIVE' && isMounted) {
          setIsLive(true);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const initStudio = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // 1. Create Pairing Session for Phone Camera
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pairing`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ episode_id: episodeId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create pairing session.');

        const pairingToken = data.pairing.token;
        if (isMounted) {
          setPairingUrl(`${window.location.origin}/mobile-camera?token=${pairingToken}`);
        }

        // 2. Setup Socket.io Signaling
        const socket = io(process.env.NEXT_PUBLIC_API_URL.replace('/api', ''));
        socketRef.current = socket;
        socket.emit('join-room', pairingToken);

        socket.on('peer-joined', () => {
          if (isMounted) setCameraConnected(true);
        });

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0] && isMounted) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCameraConnected(true);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { room: pairingToken, candidate: event.candidate });
          }
        };

        socket.on('offer', async (offer) => {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { room: pairingToken, answer });
        });

        socket.on('ice-candidate', async (candidate) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error(e);
          }
        });

        // 3. Fetch Admitted Speakers & Broadcast Status
        await fetchSpeakers();
        await fetchBroadcastStatus();
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          if (err.message.includes('Unauthorized') || err.message.includes('token')) {
            localStorage.removeItem('token');
            router.push('/login');
          }
        }
      }
    };

    initStudio();

    const pollInterval = setInterval(() => {
      fetchSpeakers();
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (socketRef.current) socketRef.current.disconnect();
      if (pcRef.current) pcRef.current.close();
    };
  }, [episodeId, router]);

  const toggleBroadcast = async () => {
    setLoadingBroadcast(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const endpoint = isLive ? '/media/end' : '/media/start';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ episode_id: episodeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle broadcast status.');

      setIsLive(!isLive);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBroadcast(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Studio Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/episodes')} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-lg">OffScript Studio Control Room</span>
            <span className={`ml-3 px-2.5 py-0.5 rounded text-xs font-semibold ${isLive ? 'bg-rose-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400'}`}>
              {isLive ? 'LIVE ON AIR' : 'STUDIO OFFLINE'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/episodes/${episodeId}/speakers`)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm text-zinc-300"
          >
            <Users className="w-4 h-4 text-rose-500" />
            <span>Manage Speakers ({admittedSpeakers.length}/7)</span>
          </button>

          <button
            onClick={toggleBroadcast}
            disabled={loadingBroadcast}
            className={`flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg text-sm transition-all shadow-lg ${
              isLive ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            {isLive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isLive ? 'End Broadcast' : 'Go Live'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 p-8 gap-8 max-w-7xl mx-auto w-full">
        {/* Center Video Area (Phone Camera + Speaker Tiles) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="relative aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl">
            <video ref={remoteVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!cameraConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-6 text-center">
                <VideoOff className="w-12 h-12 text-zinc-600 mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">Primary Phone Camera Inactive</h3>
                <p className="text-sm text-zinc-400">Scan the QR code in the sidebar with your phone to start broadcasting.</p>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-zinc-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-200 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cameraConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>Primary Phone Camera</span>
            </div>
          </div>

          {/* Admitted Speakers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {admittedSpeakers.map((sp) => (
              <div key={sp.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center aspect-video relative">
                <Users className="w-8 h-8 text-zinc-600 mb-2" />
                <span className="text-xs font-medium text-white truncate max-w-full">{sp.speaker_name}</span>
                <span className="absolute bottom-2 left-2 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Connected</span>
              </div>
            ))}
            {admittedSpeakers.length === 0 && (
              <div className="col-span-full py-6 bg-zinc-900/30 border border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                No speakers admitted yet. Invite speakers from the speaker management panel.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: QR Code & Quick Controls */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white font-semibold pb-4 border-b border-zinc-800">
              <QrCode className="w-5 h-5 text-rose-500" />
              <span>Phone Camera Pairing</span>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 border border-zinc-800 rounded-xl">
              {pairingUrl ? (
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <QRCodeSVG value={pairingUrl} size={160} />
                </div>
              ) : (
                <div className="w-[160px] h-[160px] flex items-center justify-center bg-zinc-900 text-zinc-600 text-xs">
                  Generating...
                </div>
              )}
              <span className="text-xs text-zinc-400 mt-4 text-center">Scan to connect phone camera</span>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 text-xs text-zinc-500 text-center">
            OffScript Studio v1.0 • Live Media Engine
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OperationalStudioPage({ params }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    }>
      <StudioContent params={params} />
    </Suspense>
  );
}