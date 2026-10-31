'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Radio, Video, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

function SpeakerJoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Initialize state directly to avoid synchronous setState calls inside useEffect
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(!token ? 'No invitation token provided.' : '');
  const [status, setStatus] = useState(!token ? 'ERROR' : 'VERIFYING'); // VERIFYING | LOBBY | WAITING | ADMITTED | REJECTED | ERROR
  const [guestName, setGuestName] = useState('');
  
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);

  // 1. Verify token asynchronously on load only if token exists
  useEffect(() => {
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid or expired invitation.');
        setInvitation(data.invitation);
        setGuestName(data.invitation.speaker_name || '');
        setStatus('LOBBY');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('ERROR');
      });
  }, [token]);

  // 2. Enter Waiting Room
  const handleEnterWaitingRoom = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/join-waiting-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enter waiting room.');

      setInvitation(data.invitation);
      setStatus('WAITING');

      const socket = io(process.env.NEXT_PUBLIC_API_URL.replace('/api', ''), {
        transports: ['polling', 'websocket'],
      });
      socketRef.current = socket;

      socket.emit('join-audience', data.invitation.episode_id);

      socket.on('speaker-status-changed', async (updated) => {
        if (updated.id === data.invitation.id) {
          setInvitation(updated);
          if (updated.status === 'ADMITTED') {
            setStatus('ADMITTED');
            await startBroadcastingToStudio(updated.episode_id, updated.id);
          } else if (updated.status === 'REMOVED' || updated.status === 'REVOKED') {
            setStatus('REJECTED');
          }
        }
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // 3. Start WebRTC Stream to Studio once Admitted
  const startBroadcastingToStudio = async (episodeId, speakerId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const socket = socketRef.current;
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('speaker-ice-candidate', { speakerId, candidate: event.candidate, episodeId });
        }
      };

      socket.on('speaker-answer', async ({ answer }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('speaker-ice-candidate', async ({ candidate }) => {
        if (candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error(e);
          }
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('speaker-offer', { speakerId, offer, episodeId });
    } catch (err) {
      console.error('Failed to start guest camera/mic:', err);
      setError('Camera or microphone access was denied.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
          <span className="font-bold text-white text-sm">OffScript Guest Portal</span>
        </div>
        <span className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full truncate max-w-[200px]">
          {invitation?.episode_title || 'Guest Session'}
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        {status === 'VERIFYING' && (
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Verifying your secure invitation link...</p>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4 w-full">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">Invalid Link</h2>
            <p className="text-xs text-zinc-400">{error}</p>
          </div>
        )}

        {status === 'LOBBY' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4 w-full shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Welcome, {guestName}</h2>
              <p className="text-xs text-zinc-400 mt-1">You are invited to join <strong>{invitation?.episode_title}</strong>.</p>
            </div>
            <button
              onClick={handleEnterWaitingRoom}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-600/20 transition-all"
            >
              Enter Waiting Room
            </button>
          </div>
        )}

        {status === 'WAITING' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4 w-full shadow-2xl">
            <Clock className="w-12 h-12 text-amber-500 animate-pulse mx-auto" />
            <h2 className="text-lg font-bold text-white">In the Waiting Room</h2>
            <p className="text-xs text-zinc-400">You are checked in. The host will admit you to the live studio shortly.</p>
          </div>
        )}

        {status === 'ADMITTED' && (
          <div className="w-full space-y-4">
            <div className="relative aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-zinc-950/70 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-800 text-[10px] font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected Live to Studio</span>
              </div>
            </div>
            <p className="text-center text-xs text-zinc-400">You are live on air with the host.</p>
          </div>
        )}

        {status === 'REJECTED' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-3 w-full">
            <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto" />
            <h2 className="text-base font-bold text-white">Session Ended</h2>
            <p className="text-xs text-zinc-400">You have been removed from this live session by the host.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SpeakerJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading portal...</div>}>
      <SpeakerJoinContent />
    </Suspense>
  );
}