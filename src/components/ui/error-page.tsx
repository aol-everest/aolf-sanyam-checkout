import { useRouter } from 'next/router';
import { Button } from './button';
import { AlertCircle } from 'lucide-react';

interface ErrorPageProps {
  error: string;
  details?: string;
}

export function ErrorPage({ error, details }: ErrorPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            {error}
          </h1>
          {details && <p className="text-gray-500 text-center">{details}</p>}
          <Button
            onClick={() => router.back()}
            className="w-full mt-4 bg-[#FF9361] hover:bg-[#ff7a3d]"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
