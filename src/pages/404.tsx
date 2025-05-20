import Head from 'next/head';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const NotFoundPage = () => {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | Art of Living</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <Image
                src="/images/med-error.svg"
                alt="Error 404"
                width={96}
                height={96}
                priority
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold mt-6 text-gray-800">404</h1>

          <h2 className="mt-2 text-lg text-gray-600">
            This page could not be found
          </h2>

          <p className="mt-4 text-sm text-gray-500">
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Button
              onClick={() => window.history.back()}
              className="max-w-[160px] w-full"
              aria-label="Go back to previous page"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
