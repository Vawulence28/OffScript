'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, ArrowLeft, Settings, Save, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    studio_name: '',
    brand_color: '#e11d48',
    auto_record: true,
    retention_days: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch settings.');
        setSettings(data.settings);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings.');

      setSettings(data.settings);
      setSuccess('Studio settings updated successfully.');
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
          <button onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Radio className="w-5 h-5 text-rose-500" />
          <span className="font-bold text-white text-lg">Studio Settings & Production Hardening</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Application Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure studio branding, recording policies, and security defaults.</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
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
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Studio Name</label>
            <input
              type="text"
              required
              value={settings.studio_name}
              onChange={(e) => setSettings({ ...settings, studio_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Brand Accent Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.brand_color}
                onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                className="w-12 h-10 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings.brand_color}
                onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                className="w-32 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-t border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-white text-sm">Automatic Broadcast Recording</h3>
              <p className="text-xs text-zinc-400">Automatically record eligible broadcasts upon starting.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_record}
              onChange={(e) => setSettings({ ...settings, auto_record: e.target.checked })}
              className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Recording Retention (Days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.retention_days}
              onChange={(e) => setSettings({ ...settings, retention_days: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end pt-4">
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
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}