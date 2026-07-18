import React, { useState } from 'react';

export default function ConnectPopup({ onSubmit, onSkip }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleValidateAndSubmit = async (e) => {
    e.preventDefault();
    if (!username) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/validate_user?username=${encodeURIComponent(username)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found on Last.fm. Please check the spelling.');
        } else {
          throw new Error('Could not connect to the backend API.');
        }
      }
      
      const data = await response.json();
      if (data.valid) {
        onSubmit(data.username || username);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="rounded-xl w-full max-w-md p-8 relative flex flex-col items-center text-center z-50" style={{ background: 'linear-gradient(145deg, rgba(23, 31, 51, 0.9) 0%, rgba(11, 19, 38, 0.95) 100%)', borderTop: '1px solid rgba(59, 130, 246, 0.3)', borderLeft: '1px solid rgba(59, 130, 246, 0.1)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.15)' }}>
          <div className="space-y-2 mb-8 w-full">
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--brand-primary)', fontFamily: '"Hanken Grotesk"', letterSpacing: '-0.01em', margin: 0 }}>Analyze Your Sound</h1>
            <p style={{ fontSize: '16px', color: '#958ea0', fontFamily: 'Inter', margin: 0 }}>Enter your Last.fm username to unlock deep auditory insights.</p>
          </div>
          <form className="w-full space-y-4 mb-8" onSubmit={handleValidateAndSubmit}>
            <div className={`flex items-center w-full bg-[#020617] border ${error ? 'border-[#FF4D4D]' : 'border-surface-variant'} rounded-lg overflow-hidden transition-all focus-within:border-primary focus-within:shadow-[0_0_8px_rgba(59,130,246,0.4)]`}>
              <div className={`flex items-center pl-3 pr-2 border-r ${error ? 'border-[#FF4D4D]/30 text-[#FF4D4D]' : 'border-surface-variant/30 text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[20px] mr-2">person</span>
                <span className="font-body-md whitespace-nowrap">last.fm/user/</span>
              </div>
              <input 
                className="w-full bg-transparent py-3 pl-3 pr-4 text-white font-body-md focus:outline-none" 
                placeholder="username" 
                type="text" 
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
            </div>
            
            {error && (
              <div style={{ color: '#FF4D4D', fontSize: '13px', textAlign: 'left', marginTop: '-8px', marginBottom: '8px', fontFamily: 'Inter', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full rounded-lg h-12 flex items-center justify-center space-x-2 font-label-caps text-[14px] text-white tracking-widest decoration-none transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]" style={{ background: loading ? 'rgba(59, 130, 246, 0.5)' : 'var(--brand-primary)', cursor: loading ? 'not-allowed' : 'pointer' }}>
              <span>{loading ? 'VALIDATING...' : "LET'S GO"}</span>
              {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
            <button type="button" onClick={onSkip} className="block w-full py-2 text-on-surface-variant hover:text-white transition-colors font-body-sm mt-2 text-center decoration-none">
              Skip for now
            </button>
          </form>
          <button type="button" onClick={onSkip} className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    </>
  );
}
