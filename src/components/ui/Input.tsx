'use client';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#E85D3A] focus:ring-1 focus:ring-[#E85D3A] transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
