'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'locked' | 'unlocking' | 'expanding' | 'done'>('locked');
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const particles = useMemo(() =>
    Array.from({ length: 15 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      dur: 5 + Math.random() * 5,
      delay: Math.random() * 4,
    })), []
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      // Phase 1: lock spins & turns green
      setPhase('unlocking');
      // Phase 2: circle expands to fill screen
      setTimeout(() => setPhase('expanding'), 1200);
      // Phase 3: navigate
      setTimeout(() => {
        setPhase('done');
        router.push('/');
        router.refresh();
      }, 2400);
    } else {
      setShaking(true);
      setError('비밀번호가 올바르지 않습니다');
      setTimeout(() => setShaking(false), 600);
    }
  };

  const isUnlocking = phase === 'unlocking' || phase === 'expanding' || phase === 'done';
  const isExpanding = phase === 'expanding' || phase === 'done';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: '#060608' }}>

      {/* Subtle floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size,
              left: `${p.x}%`, top: `${p.y}%`,
              background: isUnlocking ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.06)',
              animation: `pfloat ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              transition: 'background 1s',
            }}
          />
        ))}
      </div>

      {/* ── Expanding circle overlay (phase: expanding) ── */}
      <div
        className="absolute z-30 rounded-full pointer-events-none"
        style={{
          width: isExpanding ? '300vmax' : '0px',
          height: isExpanding ? '300vmax' : '0px',
          background: '#0f0f0f',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          transition: isExpanding ? 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1), height 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      />

      {/* ── Center content ── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Orbit rings */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
          {/* Outer orbit ring 1 */}
          <div
            className="absolute inset-0 rounded-full border"
            style={{
              borderColor: isUnlocking ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.06)',
              animation: 'orbit-spin 12s linear infinite',
              transition: 'border-color 0.8s',
            }}
          >
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
              style={{
                background: isUnlocking ? '#34d399' : 'rgba(255,255,255,0.15)',
                boxShadow: isUnlocking ? '0 0 8px #34d399' : 'none',
                transition: 'all 0.8s',
              }}
            />
          </div>

          {/* Outer orbit ring 2 */}
          <div
            className="absolute rounded-full border"
            style={{
              inset: '16px',
              borderColor: isUnlocking ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
              animation: 'orbit-spin 8s linear infinite reverse',
              transition: 'border-color 0.8s',
            }}
          >
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
              style={{
                background: isUnlocking ? '#34d399' : 'rgba(255,255,255,0.1)',
                boxShadow: isUnlocking ? '0 0 6px #34d399' : 'none',
                transition: 'all 0.8s',
              }}
            />
          </div>

          {/* Main circle border */}
          <div
            className={`absolute rounded-full flex items-center justify-center ${shaking ? 'lock-shake' : ''}`}
            style={{
              inset: '32px',
              border: `2px solid ${isUnlocking ? '#34d399' : '#2a2a2a'}`,
              background: isUnlocking
                ? 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)',
              boxShadow: isUnlocking
                ? '0 0 30px rgba(52,211,153,0.15), inset 0 0 20px rgba(52,211,153,0.05)'
                : '0 0 20px rgba(0,0,0,0.3)',
              animation: isUnlocking ? 'unlock-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              transition: 'border-color 0.6s, box-shadow 0.8s, background 0.8s',
            }}
          >
            {/* Lock / Unlock icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke={isUnlocking ? '#34d399' : '#555'}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'stroke 0.6s' }}
            >
              {isUnlocking ? (
                // Unlocked icon
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </>
              ) : (
                // Locked icon
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </>
              )}
            </svg>
          </div>

          {/* Success checkmark (appears after unlock spin) */}
          {isUnlocking && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="check-ring absolute rounded-full" style={{ inset: '32px' }} />
            </div>
          )}
        </div>

        {/* Status */}
        <p
          className="text-xs tracking-[0.3em] uppercase font-medium mb-6"
          style={{
            color: isUnlocking ? '#34d399' : '#444',
            textShadow: isUnlocking ? '0 0 12px rgba(52,211,153,0.4)' : 'none',
            transition: 'all 0.6s',
          }}
        >
          {isUnlocking ? 'Unlocked' : 'Locked'}
        </p>

        {/* Password form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-3"
          style={{
            opacity: isUnlocking ? 0 : 1,
            transform: isUnlocking ? 'translateY(10px)' : 'translateY(0)',
            transition: 'opacity 0.4s, transform 0.4s',
            pointerEvents: isUnlocking ? 'none' : 'auto',
          }}
        >
          <div className={`relative ${shaking ? 'lock-shake' : ''}`}>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-56 px-4 py-2.5 bg-transparent border border-[#222] rounded-full text-center text-white text-sm tracking-[0.15em] placeholder:text-[#333] focus:outline-none focus:border-[#444] transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400/70 text-xs fade-in">{error}</p>
          )}

          <button
            type="submit"
            className="w-56 py-2.5 bg-transparent border border-[#222] rounded-full text-[#555] text-xs font-medium tracking-wider uppercase transition-all hover:border-[#444] hover:text-[#888] active:scale-[0.97]"
          >
            Unlock
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes pfloat {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-12px); opacity: 0.7; }
        }
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes unlock-spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(0.95); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .check-ring {
          border: 2px solid transparent;
          animation: ring-fill 0.8s ease-out 0.3s forwards;
        }
        @keyframes ring-fill {
          0% {
            border-color: transparent;
            clip-path: polygon(50% 0%, 50% 0%, 50% 50%, 50% 50%);
          }
          100% {
            border-color: rgba(52,211,153,0.4);
            clip-path: polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%);
          }
        }
        .lock-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .fade-in {
          animation: fi 0.3s ease-out;
        }
        @keyframes fi {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
