'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 ${onClick ? 'cursor-pointer hover:border-[#3a3a3a] transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
