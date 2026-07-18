import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import ConnectPopup from './ConnectPopup'
import './index.css'

function App() {
  const [searchArtist, setSearchArtist] = useState('');
  const [searchTrack, setSearchTrack] = useState('');
  
  const [searchResults, setSearchResults] = useState(null); // Last.fm search matches
  const [recommendations, setRecommendations] = useState(null); // ML Output
  
  const [loading, setLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [useFallback, setUseFallback] = useState(true);
  const [useSuperTags, setUseSuperTags] = useState(false);

  // App state
  const [currentView, setCurrentView] = useState('dashboard');
  const [lastFmUsername, setLastFmUsername] = useState(() => localStorage.getItem('lastFmUsername') || '');
  const [showPopup, setShowPopup] = useState(() => !localStorage.getItem('lastFmUsername'));

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchTrack) return;
    
    setLoading(true);
    setRecommendations(null); // Clear previous recommendations
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

  const selectSongAndRecommend = async (artist, track) => {
    setSearchResults(null); // Clear search results to transition UI to recommendations
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', backgroundColor: 'var(--glass-bg)', borderRight: '1px solid var(--glass-border)', padding: '32px 24px', display: 'flex', flexDirection: 'column', zIndex: 10, backdropFilter: 'blur(20px)' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.04em' }}>
            Harmonizr <span className="brand-gradient">Pro</span>
          </h1>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }} 
             style={{ padding: '12px 16px', borderRadius: '8px', color: currentView === 'dashboard' ? 'var(--brand-primary)' : 'var(--text-secondary)', backgroundColor: currentView === 'dashboard' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', textDecoration: 'none', fontSize: '15px', fontWeight: currentView === 'dashboard' ? '600' : '500', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}>
             Home
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('recommendations'); }} 
             style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: currentView === 'recommendations' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: currentView === 'recommendations' ? 'var(--brand-primary)' : 'var(--text-secondary)', textDecoration: 'none', fontSize: '15px', fontWeight: currentView === 'recommendations' ? '600' : '500', display: 'flex', alignItems: 'center', gap: '12px' }}>
             Discovery
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 60px', position: 'relative', overflowY: 'auto' }}>
        {currentView === 'dashboard' ? (
          <Dashboard username={lastFmUsername} />
        ) : (
          <div className="animate-slide-up">
            {/* Top Header Text */}
            <div style={{ marginBottom: '40px', maxWidth: '1000px' }}>
              <h2 className="text-gradient" style={{ fontSize: '56px', fontWeight: '800', letterSpacing: '-0.03em', margin: 0, lineHeight: '1.1' }}>Sonic Discovery</h2>
              <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginTop: '8px' }}>Curate your midnight sessions with the neural engine.</p>
            </div>

            {/* Big Search Blob */}
            <section className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden', marginBottom: '48px', maxWidth: '1000px', width: '100%' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'var(--brand-primary-glow)', filter: 'blur(80px)', borderRadius: '50%', margin: '-100px -100px 0 0', pointerEvents: 'none' }}></div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200px', height: '200px', background: 'var(--brand-secondary-glow)', filter: 'blur(80px)', borderRadius: '50%', margin: '0 0 -100px -100px', pointerEvents: 'none' }}></div>
              
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
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px' }} className="animate-slide-up">
                <div>
                  <h3 style={{ fontSize: '28px', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>
                    {searchResults ? "Search Results" : "Neural Recommendations"}
                  </h3>
                </div>
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
                         onClick={() => selectSongAndRecommend(track.artist, track.name)}
                    >
                      <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {track.image ? (
                          <img src={track.image} alt="Album Art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                          </div>
                        )}
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
                    const scoreMatch = Math.max(10, Math.floor(98 - (i * 2.5))); // Mock match percentage descending
                    
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
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="data-text" style={{ fontSize: '18px', color: 'var(--brand-primary)', fontWeight: '600' }}>{i + 1}</span>
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
                      
                      <div className="check-circle" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s ease' }}>
                         <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="transparent" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s ease' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
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
        )}
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
