import React, { useEffect, useState } from 'react';

export default function Dashboard({ username }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeScale, setTimeScale] = useState('overall');
  const [playingPreview, setPlayingPreview] = useState(null);

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
          <h2 className="text-gradient" style={{ fontSize: '56px', fontWeight: '800', letterSpacing: '-0.03em', margin: 0, lineHeight: '1.1' }}>Insights Matrix</h2>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '600px' }}>Deep dive into your auditory landscape. Analyzing patterns across frequencies, genres, and temporal habits for <strong style={{ color: 'var(--text-primary)' }}>{username}</strong>.</p>
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
        <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'rgba(59, 130, 246, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '-80px -80px 0 0', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'rgba(14, 165, 233, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '0 0 -50px -50px', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"', margin: 0, marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>graphic_eq</span>
              Total Scrobbling
            </h3>
            <div className="text-gradient" style={{ fontSize: '48px', fontFamily: '"Hanken Grotesk"', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>{playcount > 1000 ? playcountK : playcount}<span style={{ fontSize: '24px', color: 'var(--brand-primary)' }}>{playcount > 1000 ? 'k' : ''}</span></div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>All time scrobbles</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'rgba(236, 72, 153, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '-80px -80px 0 0', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'rgba(168, 85, 247, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '0 0 -50px -50px', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"', margin: 0, marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#ec4899' }}>album</span>
              Top Artist
            </h3>
            <div className="text-gradient" style={{ fontSize: '32px', fontFamily: '"Hanken Grotesk"', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topartists[0]?.name || 'N/A'}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{topartists[0]?.playcount || 0} plays</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'rgba(20, 184, 166, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '-80px -80px 0 0', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'rgba(16, 185, 129, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '0 0 -50px -50px', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"', margin: 0, marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#14b8a6' }}>blur_on</span>
              User Since
            </h3>
            <div className="text-gradient" style={{ fontSize: '48px', fontFamily: '"Hanken Grotesk"', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>{info.registered?.unixtime ? new Date(info.registered.unixtime * 1000).getFullYear() : 'N/A'}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Account creation year</div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Chronotype Card */}
        <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'rgba(139, 92, 246, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '-80px -80px 0 0', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'rgba(79, 70, 229, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '0 0 -50px -50px', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"', margin: 0, marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#8b5cf6' }}>schedule</span>
              Audio Rhythm
            </h3>
            <div className="text-gradient" style={{ fontSize: '36px', fontFamily: '"Hanken Grotesk"', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>{stats?.chronotype || 'Unknown'}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Dominant listening time (Last 100 tracks)</div>
          </div>
        </div>

        {/* Binge Factor Card */}
        <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'rgba(244, 63, 94, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '-80px -80px 0 0', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'rgba(249, 115, 22, 0.35)', filter: 'blur(80px)', borderRadius: '50%', margin: '0 0 -50px -50px', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"', margin: 0, marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#f43f5e' }}>local_fire_department</span>
              Biggest Binge
            </h3>
            <div className="text-gradient" style={{ fontSize: '36px', fontFamily: '"Hanken Grotesk"', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {stats?.binge?.artist || 'None'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Streak of {stats?.binge?.streak || 0} consecutive tracks
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Artists Card */}
        <div className="lg:col-span-8 glass-panel flex flex-col min-h-[400px]" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'rgba(234, 179, 8, 0.25)', filter: 'blur(80px)', borderRadius: '50%', margin: '-80px -80px 0 0', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'rgba(245, 158, 11, 0.25)', filter: 'blur(80px)', borderRadius: '50%', margin: '0 0 -50px -50px', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#dae2fd', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"', margin: 0 }}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: '#eab308' }}>star</span>
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
        </div>

        {/* Recent Tracks */}
        <div className="lg:col-span-4 glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'var(--brand-secondary-glow)', filter: 'blur(80px)', borderRadius: '50%', margin: '-80px -80px 0 0', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'var(--brand-primary-glow)', filter: 'blur(80px)', borderRadius: '50%', margin: '0 0 -50px -50px', pointerEvents: 'none' }}></div>
          
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"', margin: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Recent Scrobbling
            </h3>
          </div>
          
          <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(stats?.recent_tracks || []).slice(0, 5).map((track, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '10px', background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}
                     onClick={(e) => {
                         if (track.preview) {
                             e.stopPropagation();
                             if (playingPreview === track.preview) setPlayingPreview(null);
                             else setPlayingPreview(track.preview);
                         }
                     }}
                >
                   {track.itunes_image || (track.image && track.image[2] && track.image[2]['#text']) ? (
                     <img src={track.itunes_image || track.image[2]['#text']} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   ) : (
                     <span className="material-symbols-outlined text-secondary text-sm">music_note</span>
                   )}
                   {track.preview && (
                     <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                     >
                        {playingPreview === track.preview ? (
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        ) : (
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        )}
                     </div>
                   )}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist?.['#text'] || track.artist?.name || track.artist}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {playingPreview && <audio src={playingPreview} autoPlay onEnded={() => setPlayingPreview(null)} />}
    </div>
  );
}
