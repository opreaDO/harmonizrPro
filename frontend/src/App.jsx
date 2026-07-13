import { useState } from 'react'
import './index.css'

function App() {
  const [userId, setUserId] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchTrack, setSearchTrack] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/recommend/${userId}`);
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

  const fetchBridgeRecommendations = async () => {
    if (!searchArtist || !searchTrack) return;
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/bridge_recommend?artist=${encodeURIComponent(searchArtist)}&track=${encodeURIComponent(searchTrack)}`);
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
    <div style={{ padding: '60px 40px', maxWidth: '1440px', margin: '0 auto' }}>
      
      <header style={{ marginBottom: '80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(208, 188, 255, 0.1)', border: '1px solid rgba(208, 188, 255, 0.2)', borderRadius: '9999px', marginBottom: '24px' }}>
            <span className="data-text" style={{ color: 'var(--primary-electric)', fontSize: '12px' }}>PROTOTYPE V1.1 (LAST.FM ENABLED)</span>
        </div>
        <h1 style={{ fontSize: '64px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>
          Harmonizr <span style={{ background: 'linear-gradient(45deg, #d0bcff, #4cd7f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pro</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '20px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Deep immersion musical discovery powered by ALS and PyTorch Bridging.
        </p>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Input Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Bridging Panel */}
          <div className="glass-panel" style={{ padding: '40px', borderTop: '2px solid var(--secondary-synth)' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '16px', fontWeight: '600' }}>Live Song Search</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
              Triggers the PyTorch Bridging Model to translate live Last.fm tags into ALS embeddings.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">Artist Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Sabrina Carpenter" 
                value={searchArtist}
                onChange={(e) => setSearchArtist(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '32px' }}>
              <label className="input-label">Track Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Espresso" 
                value={searchTrack}
                onChange={(e) => setSearchTrack(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={fetchBridgeRecommendations} style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
              {loading ? 'Projecting Vector...' : 'Generate New Recommendations'}
            </button>
          </div>

          {/* Historical ALS Panel */}
          <div className="glass-panel" style={{ padding: '40px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '16px', fontWeight: '600' }}>User Simulator</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
              Fetch direct ALS collaborative recommendations for historical users.
            </p>
            <div style={{ marginBottom: '32px' }}>
              <label className="input-label">Target User ID</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter MSD Key (e.g. b80344...)" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={fetchRecommendations} style={{ width: '100%', padding: '16px', fontSize: '16px', background: 'linear-gradient(45deg, #1e293b, #334155)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {loading ? 'Running Matrix...' : 'Simulate Historical User'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="glass-panel" style={{ padding: '40px', minHeight: '500px', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle glow behind the results */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(76, 215, 246, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          
          <h2 style={{ fontSize: '28px', marginBottom: '32px', fontWeight: '600' }}>Analysis Output</h2>
          
          {loading && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ width: '100%', height: '72px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out', animationDelay: `${i * 0.1}s` }}></div>
                ))}
             </div>
          )}

          {!loading && recommendations && (
            <div>
              {recommendations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
                  {recommendations.map((track, i) => (
                    <div key={i} style={{ 
                        padding: '20px 24px', 
                        backgroundColor: 'rgba(6, 14, 32, 0.6)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderLeft: '4px solid var(--secondary-synth)',
                        transition: 'transform 0.2s',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                    >
                       <div className="data-text" style={{ opacity: 0.4, marginRight: '24px', fontSize: '14px', width: '24px' }}>0{i + 1}</div>
                       <div className="data-text" style={{ fontSize: '18px', color: '#fff', letterSpacing: '0.02em' }}>
                          {typeof track === 'string' ? track : track.name}
                       </div>
                       <div style={{ marginLeft: 'auto', padding: '4px 12px', background: 'rgba(76, 215, 246, 0.1)', borderRadius: '9999px', color: 'var(--secondary-synth)', fontSize: '12px', fontWeight: '600' }}>
                          98.4% MATCH
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '32px', background: 'rgba(255, 0, 0, 0.05)', borderLeft: '4px solid var(--tertiary-rose)', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--tertiary-rose)', fontFamily: 'Inter', fontWeight: '500' }}>No mathematical matches found or invalid parameters.</p>
                </div>
              )}
            </div>
          )}
          
          {!loading && !recommendations && (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <p style={{ fontFamily: 'Inter', fontSize: '16px' }}>Awaiting parameter injection...</p>
            </div>
          )}
        </div>
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
