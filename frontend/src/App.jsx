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
        {/* Top Search Header */}
        <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: '800px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Track Name (Required)" 
                value={searchTrack}
                onChange={(e) => setSearchTrack(e.target.value)}
                style={{ flex: 2 }}
                required
              />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Artist (Optional)" 
                value={searchArtist}
                onChange={(e) => setSearchArtist(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0 32px' }}>
                {loading && !recommendations && !searchResults ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        </header>

        {/* Hero Area */}
        {currentQuery && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {searchResults ? "Select a track below to bridge" : "Recommendations based on"}
            </h2>
            <h3 style={{ fontSize: '48px', color: '#fff', fontWeight: '700', letterSpacing: '-0.02em' }}>
              {currentQuery}
            </h3>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-panel" style={{ height: '96px', animation: 'pulse 1.5s infinite ease-in-out', animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
        )}

        {/* Step 1: Search Results Grid */}
        {!loading && searchResults && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {searchResults.length > 0 ? (
              searchResults.map((track, i) => (
                <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', borderLeft: '4px solid var(--secondary-synth)' }}
                     onClick={() => selectSongAndRecommend(track.artist, track.name)}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.transform = 'translateY(-4px)';
                       e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(76, 215, 246, 0.1)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = '0 16px 40px 0 rgba(0, 0, 0, 0.4)';
                     }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginBottom: '4px' }}>{track.name}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{track.artist}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', padding: '6px 16px', background: 'var(--primary-electric)', borderRadius: '8px', color: '#000', fontSize: '13px', fontWeight: '600' }}>
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

        {/* Step 2: Final Recommendations Grid */}
        {!loading && recommendations && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {recommendations.length > 0 ? (
              recommendations.map((track, i) => {
                const trackName = typeof track === 'string' ? track : track.name;
                const split = trackName.split(' - ');
                const artist = split[0];
                const title = split.slice(1).join(' - ') || trackName;
                
                return (
                <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.transform = 'translateY(-4px)';
                       e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(76, 215, 246, 0.1)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = '0 16px 40px 0 rgba(0, 0, 0, 0.4)';
                     }}
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
                     <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-electric)', fontFamily: 'Geist' }}>0{i + 1}</span>
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginBottom: '4px' }}>{title}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{artist}</div>
                  </div>
                </div>
              )})
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '32px', background: 'rgba(255, 0, 0, 0.05)', borderLeft: '4px solid var(--tertiary-rose)', borderRadius: '8px' }}>
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
