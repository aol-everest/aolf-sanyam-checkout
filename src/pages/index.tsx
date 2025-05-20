import { useEffect } from 'react';
import { FullScreenLoader } from '@/components/ui/loader';

export default function Home() {
  useEffect(() => {
    // Redirect to the AOLF courses page
    window.location.href = 'https://members.us.artofliving.org/us-en/courses';
  }, []);

  return (
    <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
      <FullScreenLoader />
      <p className="text-center text-lg">Redirecting to courses...</p>
    </div>
  );
}
