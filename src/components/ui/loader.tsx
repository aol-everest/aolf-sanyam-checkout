import { Loader2 } from 'lucide-react';

interface LoaderProps {
  message?: string;
}

export function FullScreenLoader({
  message = 'Processing payment...',
}: LoaderProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF9361]" />
        <p className="text-lg font-medium text-gray-900">{message}</p>
      </div>
    </div>
  );
}
