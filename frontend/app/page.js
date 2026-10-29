'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radio,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Users,
  Compass,
  Laptop,
  Briefcase,
  Heart,
  TrendingUp,
  Globe,
  Palette,
  GraduationCap,
  ChevronDown,
  Calendar,
  Mic,
  CheckCircle2,
  Clock,
  Play
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [activeFaq, setActiveFaq] = useState(null);
  const [topicSubmitted, setTopicSubmitted] = useState(false);
  const [guestSubmitted, setGuestSubmitted] = useState(false);
  
  // State for upcoming sessions pulled from database
  const [scheduledEpisodes, setScheduledEpisodes] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/public?status=SCHEDULED`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch upcoming sessions');
        return res.json();
      })
      .then((data) => {
        setScheduledEpisodes(data.episodes || []);
      })
      .catch((err) => {
        console.error('Error fetching scheduled episodes:', err);
        setScheduledEpisodes([]);
      })
      .finally(() => {
        setLoadingSessions(false);
      });
  }, []);

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      experience_bio: formData.get('experience_bio'),
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit guest application.');
      setGuestSubmitted(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      topic: formData.get('topic'),
      details: formData.get('details'),
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit topic suggestion.');
      setTopicSubmitted(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* ------------------ NAVIGATION ------------------ */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <Image 
              src="/logo.png" 
              alt="OFFSCRIPT Logo" 
              width={160} 
              height={40} 
              priority 
              className="object-contain mix-blend-screen" 
            />
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#sessions" className="hover:text-white transition-colors">Upcoming Sessions</a>
            <a href="#topics" className="hover:text-white transition-colors">Topics</a>
            <a href="#host" className="hover:text-white transition-colors">Host</a>
            <a href="#guests" className="hover:text-white transition-colors">Guests</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-xs transition-all shadow-lg shadow-rose-600/20 hover:scale-105 active:scale-95"
            >
              <span>Host Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------ HERO SECTION ------------------ */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6 border-b border-zinc-800/60 bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coming Soon • The Next-Gen Live Studio</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black tracking-tight text-white leading-tight">
            Real Conversations. <br />
            <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Different Perspectives.
            </span> <br />
            No Pretending.
          </h1>

          <p className="text-base md:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
            Welcome to <strong className="text-white">OFFSCRIPT,</strong> a space for honest conversations, thought-provoking discussions, personal experiences, fresh ideas, and perspectives that deserve more than a passing moment.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#sessions"
              className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-all shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2 hover:scale-105"
            >
              <span>Explore OFFSCRIPT</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#guest-form"
              className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Be Part of the Conversation</span>
            </a>
          </div>
        </div>
      </section>

      {/* ------------------ WELCOME TO OFFSCRIPT ------------------ */}
      <section id="about" className="py-24 px-6 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-snug">
            Life Doesn’t Always Follow a Script. Neither Should Our Conversations.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-400 text-sm md:text-base leading-relaxed">
            <p>
              We live in a world filled with opinions, information, advice, expectations, and endless conversations. Yet, in the middle of all this noise, some of the most important discussions are still left unexplored. People have stories they rarely tell, questions they hesitate to ask, and ideas that challenge conventional thinking.
            </p>
            <p>
              OFFSCRIPT exists to make room for these conversations. We believe meaningful discussions should allow room for honesty, curiosity, disagreement, reflection, laughter, learning, and the freedom to see things differently. Every episode presents an opportunity to listen, learn, and discover something new.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------ UPCOMING SESSIONS (PULLED FROM DATABASE) ------------------ */}
      <section id="sessions" className="py-24 px-6 border-b border-zinc-900 bg-zinc-900/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-widest mb-2">
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                Upcoming Live Sessions
              </h2>
            </div>
            <p className="text-zinc-400 text-xs md:text-sm max-w-md">
              Join us live, ask questions in real-time audience chat, and hear perspectives as they develop.
            </p>
          </div>

          {loadingSessions ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : scheduledEpisodes.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-sm">
              No scheduled upcoming sessions found in the database at the moment. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledEpisodes.map((ep) => (
                <div key={ep.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-zinc-700 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        Scheduled Live
                      </span>
                      {ep.scheduled_for && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                          {new Date(ep.scheduled_for).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-lg leading-snug">
                      {ep.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                      {ep.description || 'No description provided for this session yet.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">OFFSCRIPT Studio</span>
                    <button
                      onClick={() => router.push(`/watch/${ep.slug || ep.id}`)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-400 transition-colors"
                    >
                      <span>View Session</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------ BEYOND THE EXPECTED ------------------ */}
      <section className="py-24 px-6 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Beyond the Expected. Beyond the Surface.
          </h2>
          <p className="text-zinc-300 text-base md:text-lg leading-relaxed max-w-3xl">
            The word <em>offscript</em> suggests stepping away from what has been planned, rehearsed, or expected. In everyday life, we often feel the need to present a perfect version of ourselves. But real life is rarely that predictable.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-3">
              <Compass className="w-8 h-8 text-rose-500" />
              <h3 className="text-white font-bold text-base">Open to the Unexpected</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Stepping outside predetermined answers to let conversations flow naturally.</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-3">
              <MessageSquare className="w-8 h-8 text-rose-500" />
              <h3 className="text-white font-bold text-base">Overlooked Questions</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Asking the questions others may have avoided to discover deeper insights.</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-3">
              <Users className="w-8 h-8 text-rose-500" />
              <h3 className="text-white font-bold text-base">Diverse Realities</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Recognising that two people can experience the exact same situation differently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------ WHAT WE TALK ABOUT ------------------ */}
      <section id="topics" className="py-24 px-6 border-b border-zinc-900 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mt-2">
              Different Topics. Diverse Perspectives.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-3 hover:border-rose-500/40 transition-colors">
              <Laptop className="w-6 h-6 text-rose-500" />
              <h3 className="text-white font-bold text-base">01. Tech & Innovation</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Exploring AI, digital transformation, software engineering, and how tech shapes society.</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-3 hover:border-rose-500/40 transition-colors">
              <Briefcase className="w-6 h-6 text-rose-500" />
              <h3 className="text-white font-bold text-base">02. Business & Money</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">The realities of entrepreneurship, financial management, building startups, and leadership.</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-3 hover:border-rose-500/40 transition-colors">
              <Heart className="w-6 h-6 text-rose-500" />
              <h3 className="text-white font-bold text-base">03. Relationships</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Thoughtful conversations about communication, boundaries, expectations, and human connections.</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-3 hover:border-rose-500/40 transition-colors">
              <TrendingUp className="w-6 h-6 text-rose-500" />
              <h3 className="text-white font-bold text-base">04. Personal Growth</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Learning from failure, discipline, decision-making, and navigating life changes.</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-3 hover:border-rose-500/40 transition-colors">
              <Globe className="w-6 h-6 text-rose-500" />
              <h3 className="text-white font-bold text-base">05. Society & Culture</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Examining cultural norms, generational dynamics, and societal influences.</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-3 hover:border-rose-500/40 transition-colors">
              <Palette className="w-6 h-6 text-rose-500" />
              <h3 className="text-white font-bold text-base">06. Creativity & Media</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Content creation, digital storytelling, branding, and turning passion into work.</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-3 hover:border-rose-500/40 transition-colors">
              <GraduationCap className="w-6 h-6 text-rose-500" />
              <h3 className="text-white font-bold text-base">07. Career & Work</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">The future of work, skill development, navigating career transitions, and employability.</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-3 hover:border-rose-500/40 transition-colors">
              <Sparkles className="w-6 h-6 text-rose-500" />
              <h3 className="text-white font-bold text-base">08. Open Conversations</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">Unexpected questions, emerging trends, and discussions that do not fit in a box.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------ WHY OFFSCRIPT? ------------------ */}
      <section className="py-24 px-6 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            More Than a Podcast. A Space for Perspective.
          </h2>
          <p className="text-zinc-300 text-base md:text-lg leading-relaxed">
            A guest does not have to be in the same city as the host to contribute to a meaningful conversation. OFFSCRIPT embraces remote conversations, bringing together voices from around the globe into one unified discussion.
          </p>
        </div>
      </section>

      {/* ------------------ HOW IT WORKS ------------------ */}
      <section className="py-24 px-6 border-b border-zinc-900 bg-zinc-900/20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mt-2">
              How OFFSCRIPT Works
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 font-bold">1</div>
              <div>
                <h3 className="text-white font-bold text-lg">Discover a Conversation</h3>
                <p className="text-zinc-400 text-xs mt-1">Explore upcoming sessions, featured topics, and guest announcements that match your interests.</p>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 font-bold">2</div>
              <div>
                <h3 className="text-white font-bold text-lg">Join Us Live</h3>
                <p className="text-zinc-400 text-xs mt-1">When a session goes live, join directly from your phone or desktop browser with ultra-low latency.</p>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 font-bold">3</div>
              <div>
                <h3 className="text-white font-bold text-lg">Share Your Thoughts</h3>
                <p className="text-zinc-400 text-xs mt-1">Engage via live audience chat, ask questions, and have your comments featured on air by the host.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------ MEET THE HOST ------------------ */}
      <section id="host" className="py-24 px-6 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Meet the Host
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
                <Mic className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Oluwajuwonlo Emmanuel</h3>
                <p className="text-xs text-rose-400 font-medium">Founder & Host, OFFSCRIPT</p>
              </div>
            </div>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
              "Every conversation begins with someone willing to ask a question. My role is not to pretend to have every answer, but to ask questions, listen carefully, explore ideas, and help bring conversations to life."
            </p>
          </div>
        </div>
      </section>

      {/* ------------------ FOR OUR GUESTS ------------------ */}
      <section id="guests" className="py-24 px-6 border-b border-zinc-900 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto space-y-8" id="guest-form">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            You Have a Story. Let’s Have a Conversation.
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Become an OFFSCRIPT Guest</h3>
            {guestSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you! Your guest application has been submitted successfully.</span>
              </div>
            ) : (
              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" name="name" required placeholder="Your Name" className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500" />
                  <input type="email" name="email" required placeholder="Your Email" className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500" />
                </div>
                <textarea rows={3} name="experience_bio" required placeholder="Tell us briefly about your experience or topic idea..." className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500" />
                <button type="submit" className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-xs transition-all shadow-lg shadow-rose-600/20">
                  Submit Guest Interest
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ------------------ SUGGEST A TOPIC ------------------ */}
      <section className="py-24 px-6 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            What Do You Think We Should Talk About?
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
            {topicSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you! Your topic suggestion has been received.</span>
              </div>
            ) : (
              <form onSubmit={handleTopicSubmit} className="space-y-4">
                <input type="text" name="topic" required placeholder="Proposed Topic or Question" className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500" />
                <textarea rows={3} name="details" placeholder="Add any extra details or context..." className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500" />
                <button type="submit" className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-xs transition-all shadow-lg shadow-rose-600/20">
                  Suggest Topic
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ------------------ FAQ ------------------ */}
      <section id="faq" className="py-24 px-6 border-b border-zinc-900 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: '1. What is OFFSCRIPT?', a: 'OFFSCRIPT is a podcast and online conversation platform focused on exploring ideas, experiences, opinions, and subjects that matter in everyday life.' },
              { q: '2. What does the name OFFSCRIPT mean?', a: 'The name represents stepping away from rehearsed answers, predictable topics, and rigid script constraints to explore honest perspectives.' },
              { q: '3. What topics will OFFSCRIPT cover?', a: 'Technology, business, entrepreneurship, relationships, personal development, education, career experiences, creativity, society, and everyday life.' },
              { q: '4. Do I need an account to watch?', a: 'No. Viewing public live broadcasts on OFFSCRIPT is completely free and accessible without requiring an account.' },
              { q: '5. Can I participate during live sessions?', a: 'Yes! Viewers can participate through live audience chat and submit comments to be highlighted on air.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-white text-sm flex items-center justify-between hover:bg-zinc-900 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-5 pt-0 text-zinc-400 text-xs leading-relaxed border-t border-zinc-800/40">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------ FOOTER ------------------ */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-16 px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-500" />
              <span className="font-bold text-white text-base">OFFSCRIPT</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Real Conversations. Different Perspectives. No Pretending.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#about" className="hover:text-white transition-colors">About OFFSCRIPT</a></li>
              <li><a href="#sessions" className="hover:text-white transition-colors">Upcoming Sessions</a></li>
              <li><a href="#topics" className="hover:text-white transition-colors">Topics</a></li>
              <li><a href="#host" className="hover:text-white transition-colors">Meet the Host</a></li>
              <li><a href="#guests" className="hover:text-white transition-colors">Become a Guest</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">Explore</h4>
            <ul className="space-y-2">
              <li>Tech & Innovation</li>
              <li>Business & Money</li>
              <li>Relationships</li>
              <li>Personal Growth</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">Community</h4>
            <p className="text-zinc-400 leading-relaxed">
              Come curious. Listen openly. Leave thinking.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <span>© 2026 OFFSCRIPT. All rights reserved.</span>
          <div className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Use</span>
            <span>Community Guidelines</span>
          </div>
        </div>
      </footer>
    </div>
  );
}