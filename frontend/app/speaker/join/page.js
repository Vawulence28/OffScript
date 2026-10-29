'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Radio, Video, VideoOff, Mic, MicOff, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

function SpeakerJoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinedWaitingRoom, setJoinedWaitingRoom] = useState(false);

  const [hasPermissions, setHasPermissions] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const previewVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token.');
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid invitation.');
        setInvitation(data.invitation);
        if (data.invitation.status === 'WAITING' || data.invitation.status === 'ADMITTED') {
          setJoinedWaitingRoom(true);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Request camera and microphone for pre-join test
  const startEquipmentTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
      setHasPermissions(true);
    } catch (err) {
      setError('Camera and microphone permissions are required to join.');
    }
  };

  const enterWaitingRoom = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/join-waiting-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enter waiting room.');
      setJoinedWaitingRoom(true);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (invitation) {
      const poll = setInterval(async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify/${token}`);
        const data = await res.json();
        if (res.ok) {
          setInvitation(data.invitation);
        }
      }, 4000);
      return () => clearInterval(poll);
    }
  }, [invitation, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h1 className="text-xl font-bold text-white mb-2">Invitation Error</h1>
        <p className="text-sm text-zinc-400 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-3">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-white">{invitation?.episode_title}</h1>
          <p className="text-xs text-zinc-400 mt-1">Speaker: <span className="text-zinc-200 font-medium">{invitation?.speaker_name}</span></p>
        </div>

        {invitation?.status === 'ADMITTED' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="font-semibold text-white text-base">You have been admitted!</h2>
            <p className="text-xs text-zinc-300">Connecting you to the live studio...</p>
          </div>
        ) : joinedWaitingRoom ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center space-y-4">
            <Clock className="w-12 h-12 text-amber-400 mx-auto animate-spin" />
            <h2 className="font-semibold text-white text-base">In the Waiting Room</h2>
            <p className="text-xs text-zinc-300">The host will admit you shortly. Please stay on this screen.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative aspect-video bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center">
              <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {!hasPermissions && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 p-4 text-center">
                  <button
                    onClick={startEquipmentTest}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium shadow"
                  >
                    Test Equipment & Camera
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={enterWaitingRoom}
              disabled={!hasPermissions}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              Enter Waiting Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SpeakerJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading...</div>}>
      <SpeakerJoinContent />
    </Suspense>
  );
}