'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Radio, Video, VideoOff, RefreshCw, AlertCircle } from 'lucide-react';

function MobileCameraContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(!token ? 'No pairing token provided.' : '');
  const [streaming, setStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    // Verify public pairing token
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pairing/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid or expired pairing session.');
        if (isMounted) {
          setSession(data.session);
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
  }, [token]);

  const startCameraAndBroadcast = async () => {
    setError('');
    try {
      // High-definition camera constraints for sharp 1080p capture
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect Signaling & WebRTC
      const socket = io(process.env.NEXT_PUBLIC_API_URL.replace('/api', ''), {
        transports: ['polling', 'websocket'],
      });
      socketRef.current = socket;

      socket.emit('join-room', token);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Force high bitrate encoding parameters on the video sender
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        try {
          const parameters = videoSender.getParameters();
          if (!parameters.encodings) {
            parameters.encodings = [{}];
          }
          parameters.encodings[0].maxBitrate = 4000000; // 4 Mbps for crisp HD
          await videoSender.setParameters(parameters);
        } catch (err) {
          console.warn('Could not set maxBitrate parameters:', err);
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { room: token, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { room: token, offer });

      socket.on('answer', async (answer) => {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('ice-candidate', async (candidate) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      });

      setStreaming(true);
    } catch (err) {
      console.error(err);
      setError('Camera/Microphone permission denied or unsupported device resolution.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (socketRef.current) socketRef.current.disconnect();
    if (pcRef.current) pcRef.current.close();
    setStreaming(false);
  };

  const switchCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (streaming) {
      stopCamera();
      setTimeout(() => startCameraAndBroadcast(), 400);
    }
  };

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
        <h1 className="text-xl font-bold text-white mb-2">Pairing Error</h1>
        <p className="text-sm text-zinc-400 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
          <span className="font-bold text-white text-sm">OffScript HD Phone Cam</span>
        </div>
        <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full truncate max-w-[180px]">
          {session?.episode_title || 'Live Broadcast'}
        </span>
      </header>

      <main className="flex-1 flex flex-col p-4 justify-between max-w-md mx-auto w-full">
        <div className="relative aspect-[9/16] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl my-auto">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!streaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 p-6 text-center">
              <Video className="w-12 h-12 text-rose-500 mb-3" />
              <h3 className="text-white font-semibold mb-1">HD Camera Ready</h3>
              <p className="text-xs text-zinc-400 mb-6">Tap start below to begin streaming high-definition video to your studio control room.</p>
              <button
                onClick={startCameraAndBroadcast}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-rose-600/20"
              >
                Start HD Camera & Stream
              </button>
            </div>
          )}
        </div>

        {streaming && (
          <div className="flex gap-4 py-4">
            <button
              onClick={switchCamera}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Flip Camera</span>
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            >
              <VideoOff className="w-4 h-4" />
              <span>Stop Stream</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MobileCameraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading...</div>}>
      <MobileCameraContent />
    </Suspense>
  );
}