import Spinner from './Spinner';

interface PageLoaderProps {
  text?: string;
}

export default function PageLoader({ text = '로딩 중...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
