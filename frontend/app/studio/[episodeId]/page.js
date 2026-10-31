'use client';

import { useEffect, useState, useRef, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import {
  Radio,
  ArrowLeft,
  QrCode,
  Video,
  VideoOff,
  Users,
  Play,
  Square,
  LayoutGrid,
  Maximize2,
  Tv,
  CheckCircle,
  XCircle,
} from 'lucide-react';

function StudioContent({ params }) {
  const unwrappedParams = use(params);
  const episodeId = unwrappedParams.episodeId;
  const router = useRouter();

  const [pairingUrl, setPairingUrl] = useState('');
  const [cameraConnected, setCameraConnected] = useState(false);
  const [admittedSpeakers, setAdmittedSpeakers] = useState([]);
  const [allInvitations, setAllInvitations] = useState([]);
  const [showSpeakerDrawer, setShowSpeakerDrawer] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [loadingBroadcast, setLoadingBroadcast] = useState(false);
  const [error, setError] = useState('');

  // Layout & Graphics State
  const [layoutMode, setLayoutMode] = useState('side-by-side'); // 'side-by-side' | 'spotlight'
  const [lowerThirdText, setLowerThirdText] = useState('');
  const [lowerThirdTitle, setLowerThirdTitle] = useState('');
  const [lowerThirdActive, setLowerThirdActive] = useState(false);

  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);

  // Initialize studio session & signaling
  useEffect(() => {
    if (!episodeId) return;

    let isMounted = true;

    const fetchSpeakers = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}/invitations`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (res.ok && isMounted) {
          const invs = data.invitations || [];
          setAllInvitations(invs);
          setAdmittedSpeakers(invs.filter((i) => i.status === 'ADMITTED'));
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
            Authorization: `Bearer ${token}`,
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
            Authorization: `Bearer ${token}`,
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
        const socket = io(process.env.NEXT_PUBLIC_API_URL.replace('/api', ''), {
          transports: ['polling', 'websocket'],
        });
        socketRef.current = socket;

        socket.emit('join-room', pairingToken);
        socket.emit('join-audience', episodeId);

        socket.on('peer-joined', () => {
          if (isMounted) setCameraConnected(true);
        });

        // Real-time listener for speaker status updates
        socket.on('speaker-status-changed', (updatedInv) => {
          if (!isMounted) return;
          setAllInvitations((prev) =>
            prev.map((i) => (i.id === updatedInv.id ? updatedInv : i))
          );
          setAdmittedSpeakers((prev) =>
            updatedInv.status === 'ADMITTED'
              ? [...prev.filter((i) => i.id !== updatedInv.id), updatedInv]
              : prev.filter((i) => i.id !== updatedInv.id)
          );
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

  // Handle Dynamic Speaker Admission
  const handleSpeakerAdmission = async (invitationId, action) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const endpoint = action === 'ADMIT'
      ? `/invitations/${invitationId}/admit`
      : `/invitations/${invitationId}/remove`;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok && data.invitation) {
        const updated = data.invitation;
        setAllInvitations((prev) =>
          prev.map((i) => (i.id === updated.id ? updated : i))
        );
        setAdmittedSpeakers((prev) =>
          updated.status === 'ADMITTED'
            ? [...prev.filter((i) => i.id !== updated.id), updated]
            : prev.filter((i) => i.id !== updated.id)
        );
      }
    } catch (e) {
      console.error('Admission toggle error:', e);
    }
  };

  // Toggle Graphics Lower Third Overlay
  const toggleLowerThird = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newState = !lowerThirdActive;
    setLowerThirdActive(newState);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lower-third/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episode_id: episodeId,
          active: newState,
          name: lowerThirdText,
          title: lowerThirdTitle,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

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
          Authorization: `Bearer ${token}`,
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navbar */}
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

        <div className="flex items-center gap-3">
          {/* Layout Controls */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => setLayoutMode('side-by-side')}
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 ${layoutMode === 'side-by-side' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setLayoutMode('spotlight')}
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 ${layoutMode === 'spotlight' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Solo</span>
            </button>
          </div>

          <button
            onClick={() => setShowSpeakerDrawer(!showSpeakerDrawer)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 relative"
          >
            <Users className="w-4 h-4 text-rose-500" />
            <span>Manage Speakers ({admittedSpeakers.length})</span>
            {allInvitations.some(i => i.status === 'WAITING') && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

          <button
            onClick={toggleBroadcast}
            disabled={loadingBroadcast}
            className={`flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg text-xs transition-all shadow-lg ${
              isLive ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            {isLive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isLive ? 'End Broadcast' : 'Go Live'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Display */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 p-8 gap-8 max-w-7xl mx-auto w-full">
        {/* Stage Video Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className={`grid gap-4 ${layoutMode === 'side-by-side' && admittedSpeakers.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Phone Camera Tile */}
            <div className="relative aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              {/* 2-Way Audio Enabled (muted={false}) */}
              <video ref={remoteVideoRef} autoPlay playsInline muted={false} className="w-full h-full object-cover" />
              {!cameraConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-6 text-center">
                  <VideoOff className="w-12 h-12 text-zinc-600 mb-3" />
                  <h3 className="text-sm font-semibold text-white mb-1">Host Phone Camera Offline</h3>
                  <p className="text-xs text-zinc-400">Scan QR code to connect host feed.</p>
                </div>
              )}
              <div className="absolute top-4 left-4 bg-zinc-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-200 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cameraConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>Host Feed</span>
              </div>

              {/* On-Air Lower Third Overlay Preview */}
              {lowerThirdActive && (
                <div className="absolute bottom-6 left-6 bg-zinc-950/90 border-l-4 border-rose-500 px-4 py-2 rounded-r-lg shadow-xl">
                  <h4 className="text-sm font-bold text-white tracking-wide">{lowerThirdText || 'Host Speaker'}</h4>
                  <p className="text-xs text-rose-400 font-medium">{lowerThirdTitle || 'OffScript Studio'}</p>
                </div>
              )}
            </div>

            {/* Admitted Speakers Tiles */}
            {layoutMode === 'side-by-side' && admittedSpeakers.map((sp) => (
              <div key={sp.id} className="relative aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4">
                <Users className="w-10 h-10 text-rose-500 mb-2" />
                <span className="text-xs font-semibold text-white truncate max-w-full">{sp.speaker_name}</span>
                <span className="text-[10px] text-zinc-400 mt-1">{sp.speaker_email || 'Guest Speaker'}</span>
                <span className="absolute top-3 right-3 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Live Connected</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Controls & Lower Thirds Drawer */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white font-semibold pb-4 border-b border-zinc-800">
              <Tv className="w-5 h-5 text-rose-500" />
              <span>Graphics & Lower Thirds</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Speaker Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alex Johnson"
                  value={lowerThirdText}
                  onChange={(e) => setLowerThirdText(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Title / Topic Header</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Researcher"
                  value={lowerThirdTitle}
                  onChange={(e) => setLowerThirdTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                onClick={toggleLowerThird}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  lowerThirdActive ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {lowerThirdActive ? 'Hide Lower Third Overlay' : 'Show Lower Third On-Air'}
              </button>
            </div>

            {/* QR Code Section */}
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-white font-semibold mb-3 text-xs">
                <QrCode className="w-4 h-4 text-rose-500" />
                <span>Pair Host Camera</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                {pairingUrl ? (
                  <div className="bg-white p-3 rounded-lg">
                    <QRCodeSVG value={pairingUrl} size={130} />
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500">Generating pairing link...</span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Speaker Management Drawer Overlay */}
          {showSpeakerDrawer && (
            <div className="fixed inset-y-0 right-0 w-80 bg-zinc-950 border-l border-zinc-800 p-6 z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                <h3 className="font-bold text-white text-sm">Speaker Waiting Room</h3>
                <button onClick={() => setShowSpeakerDrawer(false)} className="text-zinc-400 hover:text-white text-xs">
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {allInvitations.map((inv) => (
                  <div key={inv.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">{inv.speaker_name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${inv.status === 'WAITING' ? 'bg-amber-500/10 text-amber-400' : inv.status === 'ADMITTED' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500'}`}>
                        {inv.status}
                      </span>
                    </div>
                    {inv.status !== 'ADMITTED' ? (
                      <button
                        onClick={() => handleSpeakerAdmission(inv.id, 'ADMIT')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Admit
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSpeakerAdmission(inv.id, 'REMOVE')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                ))}
                {allInvitations.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center py-6">No speaker invitations created yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OperationalStudioPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
          <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        </div>
      }
    >
      <StudioContent params={params} />
    </Suspense>
  );
}