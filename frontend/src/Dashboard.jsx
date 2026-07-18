import React, { useEffect, useState } from 'react';

export default function Dashboard({ username }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeScale, setTimeScale] = useState('overall');

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/v1/user_stats?username=${username}&period=${timeScale}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [username, timeScale]);

  if (loading) {
    return <div className="text-on-surface-variant flex items-center justify-center h-[500px] text-xl">Loading your auditory landscape...</div>;
  }

  if (!username) {
    return <div className="text-on-surface-variant flex items-center justify-center h-[500px] text-xl">Connect your Last.fm account to view insights.</div>;
  }

  const info = stats?.info || {};
  const playcount = info.playcount || 0;
  const playcountK = (playcount / 1000).toFixed(1);
  const topartists = stats?.top_artists || [];

  return (
    <div className="flex-1 pb-12 w-full animate-fade-in">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 style={{ fontSize: '48px', fontWeight: '700', color: '#dae2fd', fontFamily: '"Hanken Grotesk"', letterSpacing: '-0.02em', margin: 0, lineHeight: '56px', textShadow: '0 0 16px rgba(208, 188, 255, 0.3)', marginBottom: '8px' }}>Insights Matrix</h2>
          <p style={{ fontSize: '16px', color: '#958ea0', fontFamily: 'Inter', margin: 0, maxWidth: '600px' }}>Deep dive into your auditory landscape. Analyzing patterns across frequencies, genres, and temporal habits for <strong style={{ color: '#dae2fd' }}>{username}</strong>.</p>
        </div>
        {/* Time Filter */}
        <div className="flex bg-surface-container rounded-full p-1 border border-white/5 self-start md:self-end">
          <button 
            onClick={() => setTimeScale('1month')}
            className={`px-6 py-2 rounded-full font-label-caps transition-colors ${timeScale === '1month' ? 'bg-[rgba(59,130,246,0.15)] text-primary border border-primary/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]' : 'text-outline hover:text-on-background'}`}>
            30D
          </button>
          <button 
            onClick={() => setTimeScale('overall')}
            className={`px-6 py-2 rounded-full font-label-caps transition-colors ${timeScale === 'overall' ? 'bg-[rgba(59,130,246,0.15)] text-primary border border-primary/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]' : 'text-outline hover:text-on-background'}`}>
            ALL
          </button>
        </div>
      </header>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl p-6 relative overflow-hidden group" style={{ background: 'linear-gradient(145deg, rgba(23, 31, 51, 0.6) 0%, rgba(11, 19, 38, 0.4) 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-outline uppercase tracking-widest text-[12px]">Total Scrobbling</span>
            <span className="material-symbols-outlined text-primary">graphic_eq</span>
          </div>
          <div style={{ fontSize: '48px', color: '#dae2fd', fontFamily: 'Geist', fontWeight: '500', letterSpacing: '0.05em', marginBottom: '8px' }}>{playcount > 1000 ? playcountK : playcount}<span className="text-lg text-primary">{playcount > 1000 ? 'k' : ''}</span></div>
          <div className="font-body-sm text-secondary flex items-center gap-1">All time scrobbles</div>
        </div>

        <div className="rounded-xl p-6 relative overflow-hidden group" style={{ background: 'linear-gradient(145deg, rgba(23, 31, 51, 0.6) 0%, rgba(11, 19, 38, 0.4) 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-outline uppercase tracking-widest text-[12px]">Top Artist</span>
            <span className="material-symbols-outlined text-secondary">album</span>
          </div>
          <div style={{ fontSize: '30px', color: '#dae2fd', fontFamily: 'Geist', fontWeight: '500', letterSpacing: '0.05em', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topartists[0]?.name || 'N/A'}</div>
          <div className="font-body-sm text-on-surface-variant">{topartists[0]?.playcount || 0} plays</div>
        </div>

        <div className="rounded-xl p-6 relative overflow-hidden group" style={{ background: 'linear-gradient(145deg, rgba(23, 31, 51, 0.6) 0%, rgba(11, 19, 38, 0.4) 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl group-hover:bg-tertiary/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-outline uppercase tracking-widest text-[12px]">User Since</span>
            <span className="material-symbols-outlined text-tertiary">blur_on</span>
          </div>
          <div style={{ fontSize: '48px', color: '#dae2fd', fontFamily: 'Geist', fontWeight: '500', letterSpacing: '0.05em', marginBottom: '8px' }}>{info.registered?.unixtime ? new Date(info.registered.unixtime * 1000).getFullYear() : 'N/A'}</div>
          <div className="font-body-sm text-on-surface-variant">Account creation year</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Artists Card */}
        <div className="lg:col-span-8 rounded-xl p-6 flex flex-col min-h-[400px]" style={{ background: 'linear-gradient(145deg, rgba(23, 31, 51, 0.6) 0%, rgba(11, 19, 38, 0.4) 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#dae2fd', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"', margin: 0 }}>
              <span className="material-symbols-outlined text-primary text-[20px]">star</span>
              Top Resonance (Artists)
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {topartists.map((artist, i) => {
              const maxPlays = parseInt(topartists[0]?.playcount) || 1;
              const plays = parseInt(artist.playcount) || 0;
              const percentage = Math.max(10, (plays / maxPlays) * 100);
              
              return (
                <div key={i} className="group cursor-pointer">
                  <div className="flex justify-between font-body-sm mb-1">
                    <span className="text-on-background font-medium">{artist.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: '500', fontFamily: 'Geist', letterSpacing: '0.05em', color: '#958ea0' }}>{plays} plays</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full group-hover:brightness-125 transition-all" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Tracks */}
        <div className="lg:col-span-4 rounded-xl p-6 flex flex-col min-h-[400px]" style={{ background: 'linear-gradient(145deg, rgba(23, 31, 51, 0.6) 0%, rgba(11, 19, 38, 0.4) 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#dae2fd', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"', margin: 0 }}>
              <span className="material-symbols-outlined text-secondary text-[20px]">history</span>
              Recent Scrobbling
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {(stats?.recent_tracks || []).slice(0, 6).map((track, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center flex-shrink-0 overflow-hidden">
                   {track.image && track.image[1] && track.image[1]['#text'] ? (
                     <img src={track.image[1]['#text']} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <span className="material-symbols-outlined text-secondary text-sm">music_note</span>
                   )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-on-background font-body-sm font-medium truncate">{track.name}</span>
                  <span className="text-outline text-xs truncate">{track.artist?.['#text'] || track.artist?.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
