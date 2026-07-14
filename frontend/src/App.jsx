import { useState } from 'react'
import './index.css'

function App() {
  const [searchArtist, setSearchArtist] = useState('');
  const [searchTrack, setSearchTrack] = useState('');
  
  const [searchResults, setSearchResults] = useState(null); // Last.fm search matches
  const [recommendations, setRecommendations] = useState(null); // ML Output
  
  const [loading, setLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(null);

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
      const response = await fetch(`http://127.0.0.1:8000/api/v1/bridge_recommend?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`);
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRight: '1px solid var(--glass-border)', padding: '32px 24px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
            Harmonizr <span style={{ color: 'var(--secondary-synth)' }}>Pro</span>
          </h1>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="#" style={{ padding: '12px 16px', borderRadius: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}>
             Home
          </a>
          <a href="#" style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(208, 188, 255, 0.1)', color: 'var(--primary-electric)', textDecoration: 'none', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
             Recommendations
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 60px', position: 'relative', overflowY: 'auto' }}>
        {/* Top Header Text */}
        <div style={{ marginBottom: '32px', maxWidth: '1000px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '700', color: '#dae2fd', fontFamily: '"Hanken Grotesk"', letterSpacing: '-0.02em', margin: 0, lineHeight: '56px' }}>Discovery</h2>
          <p style={{ fontSize: '16px', color: '#958ea0', fontFamily: 'Inter', marginTop: '4px' }}>Curate your midnight sessions.</p>
        </div>

        {/* Big Search Blob */}
        <section style={{ backgroundColor: 'rgba(23, 31, 51, 0.6)', backdropFilter: 'blur(20px)', padding: '32px', borderRadius: '24px', position: 'relative', overflow: 'hidden', marginBottom: '48px', maxWidth: '1000px', width: '100%', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '256px', height: '256px', background: 'rgba(3, 181, 211, 0.15)', filter: 'blur(80px)', borderRadius: '50%', margin: '-80px -80px 0 0' }}></div>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#dae2fd', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Hanken Grotesk"' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
              Track Search
            </h3>
            <p style={{ fontSize: '13px', color: '#958ea0', marginTop: '12px', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--secondary-synth)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              The track you select below will be used as the acoustic seed to generate recommendations.
            </p>
          </div>
          
          <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', position: 'relative', zIndex: 10, alignItems: 'flex-end' }}>
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#958ea0', paddingLeft: '4px', fontFamily: 'Geist' }}>Song Name</label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#958ea0' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                <input 
                  type="text" 
                  placeholder="e.g. Midnight City" 
                  value={searchTrack}
                  onChange={(e) => setSearchTrack(e.target.value)}
                  style={{ width: '100%', height: '54px', backgroundColor: '#070B14', border: '1px solid #494454', borderRadius: '12px', padding: '0 16px 0 48px', color: '#dae2fd', fontSize: '16px', fontFamily: 'Inter', outline: 'none', transition: 'box-shadow 0.3s, border-color 0.3s', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#03b5d3'; e.target.style.boxShadow = '0 0 8px rgba(3, 181, 211, 0.4)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#494454'; e.target.style.boxShadow = 'none' }}
                  required
                />
              </div>
            </div>
            
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#958ea0', paddingLeft: '4px', fontFamily: 'Geist' }}>Artist Name</label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#958ea0' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <input 
                  type="text" 
                  placeholder="e.g. M83" 
                  value={searchArtist}
                  onChange={(e) => setSearchArtist(e.target.value)}
                  style={{ width: '100%', height: '54px', backgroundColor: '#070B14', border: '1px solid #494454', borderRadius: '12px', padding: '0 16px 0 48px', color: '#dae2fd', fontSize: '16px', fontFamily: 'Inter', outline: 'none', transition: 'box-shadow 0.3s, border-color 0.3s', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#03b5d3'; e.target.style.boxShadow = '0 0 8px rgba(3, 181, 211, 0.4)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#494454'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
            
            <div style={{ gridColumn: 'span 2' }}>
              <button type="submit" style={{ width: '100%', height: '54px', borderRadius: '12px', background: 'linear-gradient(135deg, #a078ff 0%, #03b5d3 100%)', color: '#000', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: 'none', boxShadow: '0 8px 20px rgba(3, 181, 211, 0.2)', fontFamily: '"Hanken Grotesk"' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                {loading && !recommendations && !searchResults ? '...' : 'SEARCH'}
              </button>
            </div>
          </form>
        </section>

        {/* Hero Area */}
        {currentQuery && (
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px' }}>
            <div>
              <h3 style={{ fontSize: '32px', color: '#fff', fontWeight: '600', letterSpacing: '-0.01em', margin: 0, fontFamily: '"Hanken Grotesk"' }}>
                {searchResults ? "Search Results" : "Recommendations"}
              </h3>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentQuery && !loading && (
          <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>Search for a track in the top bar to generate AI recommendations</p>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '1000px', width: '100%' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out', animationDelay: `${i * 0.1}s` }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ height: '16px', width: '30%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                  <div style={{ height: '14px', width: '20%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                </div>
                <div style={{ width: '80px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}></div>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Search Results List View */}
        {!loading && searchResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '1000px', width: '100%' }}>
            {searchResults.length > 0 ? (
              searchResults.map((track, i) => (
                <div key={i} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s ease', cursor: 'pointer', borderRadius: '12px', borderLeft: '4px solid var(--secondary-synth)' }}
                     onClick={() => selectSongAndRecommend(track.artist, track.name)}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                       e.currentTarget.style.borderColor = 'rgba(76, 215, 246, 0.4)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.backgroundColor = 'var(--glass-bg)';
                       e.currentTarget.style.borderColor = 'var(--glass-border)';
                     }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {track.image ? (
                      <img src={track.image} alt="Album Art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(76, 215, 246, 0.15), rgba(139, 92, 246, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary-synth)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0, fontFamily: 'Geist' }}>{track.name}</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>{track.artist}</p>
                  </div>
                  
                  <div style={{ marginLeft: 'auto', padding: '8px 20px', background: 'var(--primary-electric)', borderRadius: '8px', color: '#000', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'transform 0.2s', flexShrink: 0 }}
                       onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                       onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                     Select
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '32px', background: 'rgba(255, 0, 0, 0.05)', borderLeft: '4px solid var(--tertiary-rose)', borderRadius: '8px' }}>
                <p style={{ color: 'var(--tertiary-rose)', fontWeight: '500' }}>No songs found on Last.fm for this query.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Final Recommendations List View */}
        {!loading && recommendations && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '1000px', width: '100%' }}>
            {recommendations.length > 0 ? (
              recommendations.map((track, i) => {
                const trackName = typeof track === 'string' ? track : track.name;
                const split = trackName.split(' - ');
                const artist = split[0];
                const title = split.slice(1).join(' - ') || trackName;
                const scoreMatch = Math.max(10, Math.floor(98 - (i * 2.5))); // Mock match percentage descending
                
                return (
                <div key={i} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s ease', cursor: 'pointer', borderRadius: '12px' }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                       e.currentTarget.style.borderColor = 'rgba(208, 188, 255, 0.4)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.backgroundColor = 'var(--glass-bg)';
                       e.currentTarget.style.borderColor = 'var(--glass-border)';
                     }}
                     onClick={(e) => {
                       const check = e.currentTarget.querySelector('.check-icon');
                       const circle = e.currentTarget.querySelector('.check-circle');
                       if (check.style.stroke === 'transparent') {
                           check.style.stroke = 'var(--primary-electric)';
                           circle.style.borderColor = 'var(--primary-electric)';
                           circle.style.backgroundColor = 'rgba(208, 188, 255, 0.1)';
                       } else {
                           check.style.stroke = 'transparent';
                           circle.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                           circle.style.backgroundColor = 'transparent';
                       }
                     }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '16px', color: 'var(--primary-electric)', fontFamily: 'Geist' }}>{i + 1}</span>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0, fontFamily: 'Geist' }}>{title}</h4>
                      {i === 0 && <span style={{ background: 'var(--primary-electric)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Match</span>}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>{artist}</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '90px', flexShrink: 0, marginRight: '16px' }}>
                    <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', height: '6px', marginBottom: '6px', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--secondary-synth)', height: '100%', borderRadius: '999px', width: `${scoreMatch}%` }}></div>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--secondary-synth)', fontFamily: 'Geist', fontWeight: '500' }}>{scoreMatch}% Match</span>
                  </div>
                  
                  <div className="check-circle" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s ease' }}>
                     <svg className="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="transparent" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s ease' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
              )})
            ) : (
              <div style={{ padding: '32px', background: 'rgba(255, 0, 0, 0.05)', borderLeft: '4px solid var(--tertiary-rose)', borderRadius: '8px' }}>
                <p style={{ color: 'var(--tertiary-rose)', fontWeight: '500' }}>No recommendations could be synthesized for this query.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}

export default App
