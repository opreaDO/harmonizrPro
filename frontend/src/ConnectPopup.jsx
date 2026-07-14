import React, { useState } from 'react';

export default function ConnectPopup({ onSubmit, onSkip }) {
  const [username, setUsername] = useState('');

  return (
    <>
      <div className="fixed inset-0 z-0 opacity-40 blur-sm pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDic12PEAGcGbfrz2lV4zinMqPaoLp4OXtAlXudbuP3bgYr_QMPJhUbVGul_i7RI4b_sHRRmUMz5LL6gQSuoGuTOzLMxBxqxFHAl9esbYrIQz6RKMt4Pwtp5Kxib6ZTNMzpfhi6AV5mUhrmcHSDVWNihm5EWTk9uHcVxzccb2O2JFv6Er8gSgucab-L06EPx6Z0YvvUC-Da9pMceYXj7MoKG0HCqgudhLkvFfNlT301Y9fuIMkBuqyb')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="fixed inset-0 z-40 bg-surface/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="rounded-xl w-full max-w-md p-8 relative flex flex-col items-center text-center z-50" style={{ background: 'linear-gradient(145deg, rgba(23, 31, 51, 0.6) 0%, rgba(11, 19, 38, 0.4) 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <div className="space-y-2 mb-8 w-full">
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#d0bcff', fontFamily: '"Hanken Grotesk"', letterSpacing: '-0.01em', margin: 0 }}>Analyze Your Sound</h1>
            <p style={{ fontSize: '16px', color: '#958ea0', fontFamily: 'Inter', margin: 0 }}>Enter your Last.fm username to unlock deep auditory insights.</p>
          </div>
          <form className="w-full space-y-4 mb-8" onSubmit={(e) => { e.preventDefault(); onSubmit(username); }}>
            <div className="flex items-center w-full bg-[#020617] border border-surface-variant rounded-lg overflow-hidden transition-all focus-within:border-primary focus-within:shadow-[0_0_8px_rgba(208,188,255,0.4)]">
              <div className="flex items-center pl-3 pr-2 text-on-surface-variant border-r border-surface-variant/30">
                <span className="material-symbols-outlined text-[20px] mr-2">person</span>
                <span className="font-body-md whitespace-nowrap">last.fm/user/</span>
              </div>
              <input 
                className="w-full bg-transparent py-3 pl-3 pr-4 text-on-surface font-body-md focus:outline-none" 
                placeholder="username" 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="w-full rounded-lg h-12 flex items-center justify-center space-x-2 font-label-caps text-[14px] text-black tracking-widest decoration-none bg-gradient-to-r from-primary to-secondary hover:brightness-110 transition-all shadow-[0_0_20px_rgba(208,188,255,0.2)]">
              <span>LET'S GO</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button type="button" onClick={onSkip} className="block w-full py-2 text-on-surface-variant hover:text-primary transition-colors font-body-sm mt-2 text-center decoration-none">
              Skip for now
            </button>
          </form>
          <div className="flex space-x-4 text-on-surface-variant mt-auto">
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">help</span></button>
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">settings</span></button>
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">info</span></button>
          </div>
          <button type="button" onClick={onSkip} className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    </>
  );
}
