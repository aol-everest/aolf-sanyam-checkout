import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the checkout page with default course ID
    router.push('/checkout/sahaj-samadhi');
  }, [router]);

  return (
    <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
      <p className="text-center text-lg">Redirecting to checkout...</p>
    </div>
  );
}
