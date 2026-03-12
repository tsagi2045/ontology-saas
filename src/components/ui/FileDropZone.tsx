'use client';

import { useState, useRef, useCallback } from 'react';

interface FileDropZoneProps {
  onFileLoad: (content: string, fileName: string) => void;
  accept?: string;
  label?: string;
}

export default function FileDropZone({ onFileLoad, accept = '.csv', label }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoad(content, file.name);
    };
    reader.readAsText(file);
  }, [onFileLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
        isDragging
          ? 'border-[#E85D3A] bg-[#E85D3A]/5 scale-[1.01]'
          : fileName
          ? 'border-green-500/50 bg-green-500/5'
          : 'border-[#2a2a2a] bg-[#0f0f0f] hover:border-[#3a3a3a] hover:bg-[#1a1a1a]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {fileName ? (
        <>
          <div className="text-3xl mb-2">📄</div>
          <p className="text-sm text-green-400 font-medium">{fileName}</p>
          <p className="text-xs text-gray-500 mt-1">다른 파일을 드래그하거나 클릭하여 변경</p>
        </>
      ) : (
        <>
          <div className="text-3xl mb-2">📁</div>
          <p className="text-sm text-gray-300 font-medium">
            {label || 'CSV 파일을 여기에 드래그하거나 클릭하여 선택'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{accept} 파일 지원</p>
        </>
      )}

      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#E85D3A]/10 rounded-xl">
          <p className="text-[#E85D3A] font-semibold">파일을 놓으세요</p>
        </div>
      )}
    </div>
  );
}
