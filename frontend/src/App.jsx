import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import ConnectPopup from './ConnectPopup'
import './index.css'

function App() {
  const [searchArtist, setSearchArtist] = useState('');
  const [searchTrack, setSearchTrack] = useState('');
  
  const [searchResults, setSearchResults] = useState(null); // Last.fm search matches
  const [recommendations, setRecommendations] = useState(null); // ML Output
  const [seedTrack, setSeedTrack] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [crate, setCrate] = useState(() => {
    try { return JSON.parse(localStorage.getItem('harmonizr_crate')) || []; }
    catch { return []; }
  });
  
  useEffect(() => {
    localStorage.setItem('harmonizr_crate', JSON.stringify(crate));
  }, [crate]);

  const toggleCrate = (trackObj, e) => {
    e.stopPropagation();
    const isSaved = crate.some(t => t.name === trackObj.name && t.artist === trackObj.artist);
    if (isSaved) {
      setCrate(crate.filter(t => !(t.name === trackObj.name && t.artist === trackObj.artist)));
    } else {
      setCrate([...crate, trackObj]);
    }
  };
  
  const [loading, setLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [useFallback, setUseFallback] = useState(true);
  const [useSuperTags, setUseSuperTags] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const exportToSpotify = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/export_spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks: crate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Export failed');
      setExportResult({ success: true, url: data.playlist_url, added: data.tracks_added });
    } catch (err) {
      console.error(err);
      setExportResult({ success: false, error: err.message });
    } finally {
      setExporting(false);
    }
  };

  // App state
  const [currentView, setCurrentView] = useState('dashboard');
  const [lastFmUsername, setLastFmUsername] = useState(() => localStorage.getItem('lastFmUsername') || '');
  const [showPopup, setShowPopup] = useState(() => !localStorage.getItem('lastFmUsername'));

  // Stop playing preview when view changes
  useEffect(() => {
    setPlayingPreview(null);
  }, [currentView]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchTrack) return;
    
    setLoading(true);
    setRecommendations(null); // Clear previous recommendations
    setSeedTrack(null);
    setPlayingPreview(null); // Stop preview when a new search is initiated
    setCurrentQuery(`Search Results for: ${searchTrack}`);
    
    try {
      // Append artist to track search if provided to narrow down Last.fm results
      const query = searchArtist ? `${searchArtist} ${searchTrack}` : searchTrack;
      const res = await fetch(`http://127.0.0.1:8000/api/v1/search_track?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  const selectSongAndRecommend = async (trackObj) => {
    const artist = trackObj.artist;
    const track = trackObj.name;
    setSeedTrack(trackObj);
    setSearchResults(null); // Clear search results to transition UI to recommendations
    setPlayingPreview(null); // Stop preview when a song is selected
    setLoading(true);
    setCurrentQuery(`${artist} - ${track}`);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/bridge_recommend?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&use_fallback=${useFallback}&use_super_tags=${useSuperTags}`);
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error(err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', backgroundColor: 'var(--glass-bg)', borderRight: '1px solid var(--glass-border)', padding: '32px 24px', display: 'flex', flexDirection: 'column', zIndex: 10, backdropFilter: 'blur(20px)' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.04em' }}>
            Harmonizr <span className="brand-gradient">Pro</span>
          </h1>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }} 
             style={{ padding: '12px 16px', borderRadius: '8px', color: currentView === 'dashboard' ? 'var(--brand-primary)' : 'var(--text-secondary)', backgroundColor: currentView === 'dashboard' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', textDecoration: 'none', fontSize: '15px', fontWeight: currentView === 'dashboard' ? '600' : '500', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}>
             Home
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('recommendations'); }} 
             style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: currentView === 'recommendations' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: currentView === 'recommendations' ? 'var(--brand-primary)' : 'var(--text-secondary)', textDecoration: 'none', fontSize: '15px', fontWeight: currentView === 'recommendations' ? '600' : '500', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}>
             Discovery
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('crate'); }} 
             style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: currentView === 'crate' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: currentView === 'crate' ? 'var(--brand-primary)' : 'var(--text-secondary)', textDecoration: 'none', fontSize: '15px', fontWeight: currentView === 'crate' ? '600' : '500', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               My Crate
             </div>
             <span style={{ background: currentView === 'crate' ? 'var(--brand-primary)' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>{crate.length}</span>
          </a>
        </nav>

        {/* User Status / Logout Section */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'Geist', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
            Last.fm Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {lastFmUsername ? (
              <>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                  {lastFmUsername}
                </span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('lastFmUsername');
                    setLastFmUsername('');
                    setCurrentView('dashboard');
                    setShowPopup(true);
                  }}
                  style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FF4D4D'; e.currentTarget.style.color = '#FF4D4D'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--text-muted)', fontWeight: '500', fontSize: '14px', fontStyle: 'italic' }}>
                  Not Connected
                </span>
                <button 
                  onClick={() => setShowPopup(true)}
                  style={{ background: 'var(--brand-primary)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Connect
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 60px', position: 'relative', overflowY: 'auto' }}>
        
        {/* Dashboard View - Hidden via CSS when not active to preserve state/cache */}
        <div style={{ display: currentView === 'dashboard' ? 'block' : 'none' }} className={currentView === 'dashboard' ? 'animate-slide-up' : ''}>
          <Dashboard 
            username={lastFmUsername} 
            playingPreview={playingPreview} 
            setPlayingPreview={setPlayingPreview} 
            previewProgress={previewProgress} 
          />
        </div>

        {/* Crate View */}
        <div style={{ display: currentView === 'crate' ? 'block' : 'none' }} className={currentView === 'crate' ? 'animate-slide-up' : ''}>
            <div style={{ marginBottom: '40px', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2 className="text-gradient" style={{ fontSize: '56px', fontWeight: '800', letterSpacing: '-0.03em', margin: 0, lineHeight: '1.1' }}>My Crate</h2>
                <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginTop: '8px' }}>Your staging queue for Spotify exports.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <button onClick={exportToSpotify} style={{ padding: '12px 24px', background: 'var(--brand-primary)', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (crate.length === 0 || exporting) ? 0.5 : 1, pointerEvents: (crate.length === 0 || exporting) ? 'none' : 'auto', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  {exporting ? 'Exporting...' : 'Export to Spotify'}
                </button>
                {exportResult && exportResult.success && (
                  <a href={exportResult.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                     Open Playlist ({exportResult.added} tracks)
                  </a>
                )}
                {exportResult && !exportResult.success && (
                  <span style={{ fontSize: '13px', color: '#FF4D4D', fontWeight: '600' }}>Error: {exportResult.error}</span>
                )}
              </div>
            </div>
            
            {crate.length === 0 ? (
               <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, border: '1px dashed var(--glass-border)', borderRadius: '24px' }}>
                 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px' }}><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                 <p style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-secondary)' }}>Your crate is empty.</p>
               </div>
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '1000px' }}>
                 {crate.map((track, i) => (
                   <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '20px', animationDelay: `${i * 0.05}s` }}>
                     <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: playingPreview === track.preview ? `conic-gradient(var(--brand-primary) ${previewProgress}%, transparent 0)` : 'transparent', padding: playingPreview === track.preview ? '2px' : '0px', transition: 'padding 0.2s' }}
                          onClick={(e) => {
                              if (track.preview) {
                                  e.stopPropagation();
                                  if (playingPreview === track.preview) setPlayingPreview(null);
                                  else setPlayingPreview(track.preview);
                              }
                          }}
                     >
                       <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: playingPreview === track.preview ? '10px' : '12px', background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                       {track.image ? (
                         <img src={track.image} alt="Album Art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : (
                         <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <span className="data-text" style={{ fontSize: '18px', color: 'var(--brand-primary)', fontWeight: '600' }}>{i + 1}</span>
                         </div>
                       )}
                       {track.preview && (
                         <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', cursor: 'pointer' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                         >
                            {playingPreview === track.preview ? (
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                            ) : (
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            )}
                         </div>
                       )}
                     </div>
                     </div>
                     
                     <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>{track.name}</h4>
                       <p style={{ fontSize: '15px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>{track.artist}</p>
                     </div>
                     
                     <button onClick={() => setCrate(crate.filter(t => !(t.name === track.name && t.artist === track.artist)))} style={{ background: 'transparent', border: '1px solid rgba(255, 77, 77, 0.3)', color: '#FF4D4D', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
                             onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.6)'; }}
                             onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.3)'; }}
                     >
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                     </button>
                   </div>
                 ))}
               </div>
            )}
        </div>

        {/* Discovery View - Hidden via CSS when not active to preserve search state */}
        <div style={{ display: currentView === 'recommendations' ? 'block' : 'none' }} className={currentView === 'recommendations' ? 'animate-slide-up' : ''}>
            {/* Top Header Text */}
            <div style={{ marginBottom: '40px', maxWidth: '1000px' }}>
              <h2 className="text-gradient" style={{ fontSize: '56px', fontWeight: '800', letterSpacing: '-0.03em', margin: 0, lineHeight: '1.1' }}>Sonic Discovery</h2>
              <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginTop: '8px' }}>Curate your midnight sessions with the neural engine.</p>
            </div>

            {/* Big Search Blob */}
            <section className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden', marginBottom: '48px', maxWidth: '1000px', width: '100%' }}>
              
              <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                    Acoustic Seed Search
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Find the perfect track to anchor your new playlist.
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', zIndex: 10 }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: useFallback ? 'var(--brand-primary)' : 'var(--text-muted)', fontFamily: 'Geist', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Artist Fallback
                    </span>
                    <div style={{ width: '44px', height: '24px', backgroundColor: useFallback ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-highlight)', border: `1px solid ${useFallback ? 'var(--brand-primary)' : 'var(--glass-border)'}`, borderRadius: '12px', position: 'relative', transition: 'all 0.3s ease' }}>
                      <div style={{ position: 'absolute', top: '3px', left: useFallback ? '23px' : '3px', width: '16px', height: '16px', backgroundColor: useFallback ? 'var(--brand-primary)' : 'var(--text-muted)', borderRadius: '50%', transition: 'all 0.3s ease' }}></div>
                    </div>
                    <input type="checkbox" checked={useFallback} onChange={(e) => setUseFallback(e.target.checked)} style={{ display: 'none' }} />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', zIndex: 10 }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: useSuperTags ? 'var(--brand-secondary)' : 'var(--text-muted)', fontFamily: 'Geist', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Super-Tags
                    </span>
                    <div style={{ width: '44px', height: '24px', backgroundColor: useSuperTags ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-highlight)', border: `1px solid ${useSuperTags ? 'var(--brand-secondary)' : 'var(--glass-border)'}`, borderRadius: '12px', position: 'relative', transition: 'all 0.3s ease' }}>
                      <div style={{ position: 'absolute', top: '3px', left: useSuperTags ? '23px' : '3px', width: '16px', height: '16px', backgroundColor: useSuperTags ? 'var(--brand-secondary)' : 'var(--text-muted)', borderRadius: '50%', transition: 'all 0.3s ease' }}></div>
                    </div>
                    <input type="checkbox" checked={useSuperTags} onChange={(e) => setUseSuperTags(e.target.checked)} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
              
              <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', position: 'relative', zIndex: 10, alignItems: 'flex-end' }}>
                <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', paddingLeft: '4px', fontFamily: 'Geist' }}>Song Name</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                    <input 
                      type="text" 
                      placeholder="e.g. Midnight City" 
                      value={searchTrack}
                      onChange={(e) => setSearchTrack(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '48px' }}
                      required
                    />
                  </div>
                </div>
                
                <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', paddingLeft: '4px', fontFamily: 'Geist' }}>Artist Name</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <input 
                      type="text" 
                      placeholder="e.g. M83" 
                      value={searchArtist}
                      onChange={(e) => setSearchArtist(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '48px' }}
                    />
                  </div>
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <button type="submit" style={{ width: '100%', height: '54px', borderRadius: '12px', background: 'var(--brand-primary)', color: '#fff', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: 'none', transition: 'all 0.2s ease', fontFamily: '"Inter"' }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    {loading && !recommendations && !searchResults ? '...' : 'SEARCH'}
                  </button>
                </div>
              </form>
            </section>

            {/* Hero Area */}
            {currentQuery && (
              <div style={{ marginBottom: '24px', maxWidth: '1000px' }} className="animate-slide-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '28px', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>
                    {searchResults ? "Search Results" : "Neural Recommendations"}
                  </h3>
                </div>
                
                {/* Seed Track Card */}
                {seedTrack && !loading && (
                  <div style={{ marginTop: '24px', padding: '16px 24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))', borderRadius: '16px', border: '1px solid var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                      {seedTrack.image ? (
                        <img src={seedTrack.image} alt="Seed Art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, zIndex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: 'Geist' }}>Seed Track</div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {seedTrack.name}
                        <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text-secondary)' }}>by {seedTrack.artist}</span>
                      </h4>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!currentQuery && !loading && (
              <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--bg-highlight)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <p style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-secondary)' }}>Search for a track above to generate AI recommendations</p>
              </div>
            )}

            {/* Loading Skeletons */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px', width: '100%' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '20px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out', animationDelay: `${i * 0.1}s` }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--bg-highlight)' }}></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ height: '16px', width: '30%', background: 'var(--bg-highlight)', borderRadius: '4px' }}></div>
                      <div style={{ height: '14px', width: '20%', background: 'var(--bg-highlight)', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ width: '80px', height: '32px', borderRadius: '8px', background: 'var(--bg-highlight)' }}></div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 1: Search Results List View */}
            {!loading && searchResults && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px', width: '100%' }} className="animate-slide-up">
                {searchResults.length > 0 ? (
                  searchResults.map((track, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', animationDelay: `${i * 0.05}s` }}
                         onClick={() => selectSongAndRecommend(track)}
                    >
                      <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: playingPreview === track.preview ? `conic-gradient(var(--brand-primary) ${previewProgress}%, transparent 0)` : 'transparent', padding: playingPreview === track.preview ? '2px' : '0px', transition: 'padding 0.2s' }}
                           onClick={(e) => {
                               if (track.preview) {
                                   e.stopPropagation();
                                   if (playingPreview === track.preview) setPlayingPreview(null);
                                   else setPlayingPreview(track.preview);
                               }
                           }}
                      >
                        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: playingPreview === track.preview ? '10px' : '12px', background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {track.image ? (
                          <img src={track.image} alt="Album Art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                          </div>
                        )}
                        {track.preview && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', cursor: 'pointer' }}
                               onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                               onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                          >
                             {playingPreview === track.preview ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                             ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                             )}
                          </div>
                        )}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0, fontFamily: 'Inter' }}>{track.name}</h4>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>{track.artist}</p>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', marginLeft: 'auto' }}>
                        <div style={{ padding: '10px 24px', background: 'var(--brand-primary)', borderRadius: '24px', color: '#fff', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s', flexShrink: 0 }}
                             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                           Select
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '32px', background: 'rgba(255, 0, 0, 0.05)', borderLeft: '4px solid #FF4D4D', borderRadius: '12px' }}>
                    <p style={{ color: '#FF4D4D', fontWeight: '500' }}>No songs found on Last.fm for this query.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Final Recommendations List View */}
            {!loading && recommendations && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px', width: '100%' }} className="animate-slide-up">
                {recommendations.length > 0 ? (
                  recommendations.map((track, i) => {
                    const trackName = typeof track === 'string' ? track : track.name;
                    const split = trackName.split(' - ');
                    const artist = split[0];
                    const title = split.slice(1).join(' - ') || trackName;
                    const scoreMatch = track.score || 50; // Real percentage from the backend
                    
                    return (
                    <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', animationDelay: `${i * 0.05}s` }}
                         onClick={(e) => {
                           const check = e.currentTarget.querySelector('.check-icon');
                           const circle = e.currentTarget.querySelector('.check-circle');
                           if (check.style.stroke === 'transparent') {
                               check.style.stroke = 'var(--brand-primary)';
                               circle.style.borderColor = 'var(--brand-primary)';
                               circle.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                           } else {
                               check.style.stroke = 'transparent';
                               circle.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                               circle.style.backgroundColor = 'transparent';
                           }
                         }}
                    >
                      <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: playingPreview === track.preview ? `conic-gradient(var(--brand-primary) ${previewProgress}%, transparent 0)` : 'transparent', padding: playingPreview === track.preview ? '2px' : '0px', transition: 'padding 0.2s' }}
                           onClick={(e) => {
                               if (track.preview) {
                                   e.stopPropagation();
                                   if (playingPreview === track.preview) setPlayingPreview(null);
                                   else setPlayingPreview(track.preview);
                               }
                           }}
                      >
                        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: playingPreview === track.preview ? '10px' : '12px', background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {track.image ? (
                          <img src={track.image} alt="Album Art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="data-text" style={{ fontSize: '18px', color: 'var(--brand-primary)', fontWeight: '600' }}>{i + 1}</span>
                          </div>
                        )}
                        {track.preview && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', cursor: 'pointer' }}
                               onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                               onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                          >
                             {playingPreview === track.preview ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                             ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                             )}
                          </div>
                        )}
                        </div>
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>{title}</h4>
                          {i === 0 && <span style={{ background: 'var(--brand-primary)', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Match</span>}
                        </div>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>{artist}</p>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100px', flexShrink: 0, marginRight: '24px' }}>
                        <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', height: '6px', marginBottom: '8px', overflow: 'hidden' }}>
                          <div style={{ background: 'var(--brand-primary)', height: '100%', borderRadius: '999px', width: `${scoreMatch}%` }}></div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontFamily: 'Geist', fontWeight: '600', letterSpacing: '0.05em' }}>{scoreMatch}% MATCH</span>
                      </div>
                      
                      {(() => {
                        const isSaved = crate.some(t => t.name === trackName && t.artist === artist);
                        return (
                          <button onClick={(e) => toggleCrate({ name: trackName, artist: artist, image: track.image, preview: track.preview }, e)} 
                                  style={{ background: isSaved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', border: `1px solid ${isSaved ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`, color: isSaved ? '#10b981' : 'var(--brand-primary)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                             {isSaved ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
                          </button>
                        );
                      })()}
                    </div>
                  )})
                ) : (
                  <div style={{ padding: '32px', background: 'rgba(255, 0, 0, 0.05)', borderLeft: '4px solid #FF4D4D', borderRadius: '12px' }}>
                    <p style={{ color: '#FF4D4D', fontWeight: '500' }}>No recommendations could be synthesized for this query.</p>
                  </div>
                )}
              </div>
            )}
          </div>
      </main>

      {showPopup && (
        <ConnectPopup 
          onSubmit={(username) => {
            setLastFmUsername(username);
            localStorage.setItem('lastFmUsername', username);
            setShowPopup(false);
          }}
          onSkip={() => setShowPopup(false)}
        />
      )}
      
      {playingPreview && <audio src={playingPreview} autoPlay 
          onTimeUpdate={(e) => setPreviewProgress((e.target.currentTime / e.target.duration) * 100 || 0)}
          onEnded={() => { setPlayingPreview(null); setPreviewProgress(0); }} 
      />}

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

export default App
