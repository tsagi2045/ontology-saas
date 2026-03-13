'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2200);
    } else {
      setShaking(true);
      setError('비밀번호가 올바르지 않습니다');
      setTimeout(() => setShaking(false), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Chain links - left side */}
      <div className={`absolute left-0 top-0 h-full flex flex-col items-center justify-center transition-all duration-[1500ms] ease-in ${unlocking ? '-translate-x-full opacity-0 rotate-[-15deg]' : ''}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ChainLink key={`l${i}`} delay={i * 0.05} />
        ))}
      </div>

      {/* Chain links - right side */}
      <div className={`absolute right-0 top-0 h-full flex flex-col items-center justify-center transition-all duration-[1500ms] ease-in ${unlocking ? 'translate-x-full opacity-0 rotate-[15deg]' : ''}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ChainLink key={`r${i}`} delay={i * 0.05} />
        ))}
      </div>

      {/* Horizontal chains - top */}
      <div className={`absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-0 transition-all duration-[1500ms] ease-in ${unlocking ? '-translate-y-full opacity-0' : ''}`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <ChainLink key={`t${i}`} horizontal delay={i * 0.04} />
        ))}
      </div>

      {/* Horizontal chains - bottom */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-0 transition-all duration-[1500ms] ease-in ${unlocking ? 'translate-y-full opacity-0' : ''}`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <ChainLink key={`b${i}`} horizontal delay={i * 0.04} />
        ))}
      </div>

      {/* Center content */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-[2000ms] ${unlocking ? 'scale-150 opacity-0' : ''}`}>
        {/* Lock icon */}
        <div className={`relative mb-8 ${shaking ? 'animate-shake' : ''}`}>
          {/* Lock body */}
          <div className={`relative w-24 h-20 rounded-xl border-4 transition-all duration-700 ${unlocking ? 'border-emerald-400 bg-emerald-500/10' : 'border-gray-500 bg-gray-800/50'}`}>
            {/* Keyhole */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-3 transition-colors duration-700 ${unlocking ? 'border-emerald-400' : 'border-gray-400'}`} />
              <div className={`w-2 h-3 -mt-0.5 transition-colors duration-700 ${unlocking ? 'bg-emerald-400' : 'bg-gray-400'}`} />
            </div>

            {/* Lock glow when unlocking */}
            {unlocking && (
              <div className="absolute inset-0 rounded-xl bg-emerald-400/20 animate-pulse" />
            )}
          </div>

          {/* Shackle (U-shape on top) */}
          <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-14 border-4 rounded-t-full border-b-0 transition-all duration-700 ${unlocking ? 'border-emerald-400 -translate-y-4 translate-x-2 rotate-12' : 'border-gray-500'}`} />

          {/* Spark effects when unlocking */}
          {unlocking && (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-1 h-1 bg-emerald-400 rounded-full animate-spark"
                  style={{
                    '--spark-angle': `${i * 45}deg`,
                    animationDelay: `${i * 0.05}s`,
                  } as React.CSSProperties}
                />
              ))}
            </>
          )}
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-2 tracking-wider transition-colors duration-700 ${unlocking ? 'text-emerald-400' : 'text-gray-300'}`}>
          {unlocking ? 'ACCESS GRANTED' : 'LOCKED'}
        </h1>
        <p className={`text-sm mb-8 transition-colors duration-700 ${unlocking ? 'text-emerald-400/60' : 'text-gray-600'}`}>
          {unlocking ? '잠금이 해제되었습니다' : '비밀번호를 입력하여 잠금을 해제하세요'}
        </p>

        {/* Password input */}
        <form onSubmit={handleSubmit} className={`flex flex-col items-center gap-4 transition-opacity duration-500 ${unlocking ? 'opacity-0 pointer-events-none' : ''}`}>
          <div className={`relative ${shaking ? 'animate-shake' : ''}`}>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-72 px-5 py-3 bg-[#1a1a1a] border-2 border-gray-700 rounded-xl text-center text-white text-lg tracking-[0.3em] placeholder:tracking-normal placeholder:text-gray-600 focus:outline-none focus:border-gray-500 transition-all"
            />
            {/* Subtle lock icon in input */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            className="w-72 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-gray-300 font-medium transition-all hover:text-white active:scale-95"
          >
            잠금 해제
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-20px); opacity: 0.6; }
        }
        @keyframes spark {
          0% { transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(-60px) scale(0); opacity: 0; }
        }
        .animate-spark {
          animation: spark 0.8s ease-out forwards;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function ChainLink({ horizontal = false, delay = 0 }: { horizontal?: boolean; delay?: number }) {
  return (
    <div
      className={`${horizontal ? 'inline-block' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <svg
        width={horizontal ? 40 : 30}
        height={horizontal ? 30 : 40}
        viewBox="0 0 40 56"
        fill="none"
        className={`${horizontal ? 'rotate-90' : ''} opacity-20`}
      >
        <rect
          x="6" y="4" width="28" height="48" rx="14"
          stroke="#555"
          strokeWidth="4"
          fill="none"
        />
      </svg>
    </div>
  );
}
