'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ─── Chain link SVG component ─────────────────────────────────────
function ChainLink({ color = '#4a4a4a', strokeWidth = 3 }: { color?: string; strokeWidth?: number }) {
  return (
    <svg width="28" height="44" viewBox="0 0 28 44" fill="none">
      <rect x={strokeWidth / 2} y={strokeWidth / 2} width={28 - strokeWidth} height={44 - strokeWidth} rx="12" ry="12"
        stroke={color} strokeWidth={strokeWidth} fill="none" />
    </svg>
  );
}

// ─── A chain strand: series of interlocking links ─────────────────
function ChainStrand({
  linkCount,
  angle,
  offsetX = 0,
  offsetY = 0,
  unlocking,
  breakDirection,
  breakDelay = 0,
}: {
  linkCount: number;
  angle: number;
  offsetX?: number;
  offsetY?: number;
  unlocking: boolean;
  breakDirection: 'left' | 'right' | 'up' | 'down';
  breakDelay?: number;
}) {
  const breakTransforms: Record<string, string> = {
    left: 'translate(-120vw, 60vh) rotate(-45deg)',
    right: 'translate(120vw, 60vh) rotate(45deg)',
    up: 'translate(0, -120vh) rotate(20deg)',
    down: 'translate(0, 120vh) rotate(-20deg)',
  };

  return (
    <div
      className="absolute top-1/2 left-1/2 flex items-center"
      style={{
        transform: unlocking
          ? breakTransforms[breakDirection]
          : `translate(-50%, -50%) rotate(${angle}deg)`,
        transition: unlocking
          ? `transform 1.8s cubic-bezier(0.4, 0, 0.2, 1) ${breakDelay}s, opacity 1.5s ease ${breakDelay + 0.3}s`
          : 'none',
        opacity: unlocking ? 0 : 1,
        transformOrigin: 'center center',
      }}
    >
      <div
        className="flex items-center"
        style={{
          marginLeft: `${offsetX}px`,
          marginTop: `${offsetY}px`,
        }}
      >
        {Array.from({ length: linkCount }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0"
            style={{
              marginLeft: i > 0 ? '-6px' : '0',
              transform: i % 2 === 0 ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            <ChainLink color={unlocking ? '#34d399' : '#3a3a3a'} strokeWidth={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Padlock SVG ──────────────────────────────────────────────────
function Padlock({ unlocking }: { unlocking: boolean }) {
  return (
    <div className="relative w-32 h-40 flex items-center justify-center">
      {/* Shackle */}
      <svg
        className="absolute -top-1 left-1/2"
        width="72" height="56" viewBox="0 0 72 56"
        style={{
          transform: unlocking
            ? 'translateX(-50%) translateY(-16px) rotate(20deg) translateX(8px)'
            : 'translateX(-50%)',
          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transformOrigin: 'right bottom',
        }}
      >
        <path
          d="M12 56 V24 C12 12 24 4 36 4 C48 4 60 12 60 24 V56"
          stroke={unlocking ? '#34d399' : '#555'}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          style={{ transition: 'stroke 0.6s ease' }}
        />
      </svg>

      {/* Lock body */}
      <div
        className="relative w-28 h-24 rounded-2xl border-4 mt-8 flex items-center justify-center"
        style={{
          borderColor: unlocking ? '#34d399' : '#555',
          background: unlocking
            ? 'radial-gradient(circle at center, rgba(52,211,153,0.15) 0%, rgba(10,10,10,0.9) 70%)'
            : 'radial-gradient(circle at center, rgba(60,60,60,0.3) 0%, rgba(20,20,20,0.9) 70%)',
          boxShadow: unlocking
            ? '0 0 40px rgba(52,211,153,0.3), 0 0 80px rgba(52,211,153,0.1), inset 0 0 20px rgba(52,211,153,0.1)'
            : '0 0 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.3)',
          transition: 'all 0.8s ease',
        }}
      >
        {/* Keyhole */}
        <div className="flex flex-col items-center">
          <div
            className="w-5 h-5 rounded-full border-[3px]"
            style={{
              borderColor: unlocking ? '#34d399' : '#666',
              transition: 'border-color 0.6s ease',
            }}
          />
          <div
            className="w-2.5 h-4 -mt-1 rounded-b-sm"
            style={{
              background: unlocking ? '#34d399' : '#666',
              transition: 'background 0.6s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main login page ──────────────────────────────────────────────
export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [lightBurst, setLightBurst] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Stable random particles
  const particles = useMemo(() =>
    Array.from({ length: 30 }).map(() => ({
      w: 1 + Math.random() * 3,
      x: Math.random() * 100,
      y: Math.random() * 100,
      dur: 4 + Math.random() * 6,
      delay: Math.random() * 5,
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
      setUnlocking(true);
      // Phase 2: light burst after chains start breaking
      setTimeout(() => setLightBurst(true), 1200);
      // Phase 3: fade to white then navigate
      setTimeout(() => setFadeOut(true), 2200);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 3000);
    } else {
      setShaking(true);
      setError('비밀번호가 올바르지 않습니다');
      setTimeout(() => setShaking(false), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ background: '#060608' }}>
      {/* Ambient floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.w}px`,
              height: `${p.w}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: unlocking ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)',
              animation: `particle-float ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              transition: 'background 1s ease',
            }}
          />
        ))}
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.7) 70%)',
        }}
      />

      {/* ── Chain strands wrapping around center ── */}
      {/* Diagonal chains forming an X through the lock */}
      <ChainStrand linkCount={18} angle={35} unlocking={unlocking} breakDirection="right" breakDelay={0.1} />
      <ChainStrand linkCount={18} angle={-35} unlocking={unlocking} breakDirection="left" breakDelay={0.2} />
      <ChainStrand linkCount={18} angle={145} unlocking={unlocking} breakDirection="left" breakDelay={0} />
      <ChainStrand linkCount={18} angle={-145} unlocking={unlocking} breakDirection="right" breakDelay={0.15} />

      {/* Horizontal wrap */}
      <ChainStrand linkCount={20} angle={0} unlocking={unlocking} breakDirection="right" breakDelay={0.05} />
      <ChainStrand linkCount={20} angle={180} unlocking={unlocking} breakDirection="left" breakDelay={0.1} />

      {/* Vertical wrap */}
      <ChainStrand linkCount={14} angle={90} unlocking={unlocking} breakDirection="down" breakDelay={0.25} />
      <ChainStrand linkCount={14} angle={-90} unlocking={unlocking} breakDirection="up" breakDelay={0.2} />

      {/* Additional diagonal for "thick wrap" feel */}
      <ChainStrand linkCount={16} angle={20} offsetY={-30} unlocking={unlocking} breakDirection="right" breakDelay={0.15} />
      <ChainStrand linkCount={16} angle={-20} offsetY={30} unlocking={unlocking} breakDirection="left" breakDelay={0.1} />
      <ChainStrand linkCount={16} angle={160} offsetY={-30} unlocking={unlocking} breakDirection="left" breakDelay={0.2} />
      <ChainStrand linkCount={16} angle={-160} offsetY={30} unlocking={unlocking} breakDirection="right" breakDelay={0.05} />

      {/* ── Center content ── */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="flex flex-col items-center">
          {/* Padlock */}
          <div className={shaking ? 'lock-shake' : ''}>
            <Padlock unlocking={unlocking} />
          </div>

          {/* Spark burst on unlock */}
          {unlocking && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full spark-particle"
                  style={{
                    '--spark-angle': `${i * 30}deg`,
                    '--spark-distance': `${60 + Math.random() * 40}px`,
                    animationDelay: `${0.3 + i * 0.04}s`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}

          {/* Status text */}
          <div className="mt-6 text-center">
            <h1
              className="text-xl font-bold tracking-[0.25em] mb-1.5"
              style={{
                color: unlocking ? '#34d399' : '#666',
                transition: 'color 0.8s ease',
                textShadow: unlocking ? '0 0 20px rgba(52,211,153,0.5)' : 'none',
              }}
            >
              {unlocking ? 'ACCESS GRANTED' : 'LOCKED'}
            </h1>
            <p
              className="text-xs tracking-wider"
              style={{
                color: unlocking ? 'rgba(52,211,153,0.6)' : '#444',
                transition: 'color 0.8s ease',
              }}
            >
              {unlocking ? '잠금이 해제되었습니다' : '비밀번호를 입력하여 잠금을 해제하세요'}
            </p>
          </div>

          {/* Password form */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col items-center gap-3"
            style={{
              opacity: unlocking ? 0 : 1,
              transform: unlocking ? 'translateY(20px)' : 'translateY(0)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              pointerEvents: unlocking ? 'none' : 'auto',
            }}
          >
            <div className={`relative ${shaking ? 'lock-shake' : ''}`}>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-64 pl-10 pr-4 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-lg text-white text-sm tracking-[0.2em] placeholder:tracking-normal placeholder:text-gray-700 focus:outline-none focus:border-[#444] transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400/80 text-xs fade-in">{error}</p>
            )}

            <button
              type="submit"
              className="w-64 py-2.5 bg-[#151515] hover:bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-gray-400 text-sm font-medium transition-all hover:text-gray-200 hover:border-[#3a3a3a] active:scale-[0.97]"
            >
              잠금 해제
            </button>
          </form>
        </div>
      </div>

      {/* ── Light burst effect ── */}
      {lightBurst && (
        <div
          className="absolute inset-0 z-20 pointer-events-none light-burst"
          style={{
            background: 'radial-gradient(circle at center, rgba(52,211,153,0.3) 0%, transparent 60%)',
          }}
        />
      )}

      {/* ── Final fade to white ── */}
      {fadeOut && (
        <div className="absolute inset-0 z-30 fade-to-white" />
      )}

      <style jsx>{`
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-15px) scale(1.3); opacity: 0.6; }
        }

        .spark-particle {
          animation: spark-fly 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes spark-fly {
          0% {
            transform: rotate(var(--spark-angle)) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--spark-angle)) translateY(calc(-1 * var(--spark-distance))) scale(0);
            opacity: 0;
          }
        }

        .lock-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-10px) rotate(-2deg); }
          30% { transform: translateX(10px) rotate(2deg); }
          45% { transform: translateX(-8px) rotate(-1deg); }
          60% { transform: translateX(8px) rotate(1deg); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }

        .fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .light-burst {
          animation: burst 1.5s ease-out forwards;
        }
        @keyframes burst {
          0% { opacity: 0; transform: scale(0.5); }
          40% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.6; transform: scale(2); }
        }

        .fade-to-white {
          animation: white-fade 0.8s ease-in forwards;
          background: white;
        }
        @keyframes white-fade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
