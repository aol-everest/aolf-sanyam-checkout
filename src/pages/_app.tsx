import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Layout } from '@/components/layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  // Create a client with optimized configuration for high loads
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes by default
            staleTime: 5 * 60 * 1000,
            // Don't refetch on window focus by default (reduces unnecessary requests)
            refetchOnWindowFocus: false,
            // Only retry failed queries twice
            retry: 2,
            // Wait between retries to prevent overwhelming the server
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
            // Use a longer timeout for slow connections
            networkMode: 'offlineFirst',
            // Cancel abandoned queries after 30 seconds
            gcTime: 30 * 60 * 1000,
            // Enable query deduplication
            enabled: true,
          },
          mutations: {
            // Retry mutations on failure
            retry: 1,
            // Add a delay between retries
            retryDelay: 1000,
          },
        },
      })
  );

  // Get the current course title from page props if available
  const courseTitle =
    pageProps.course?.title ||
    pageProps.order?.courseTitle ||
    'Art of Living Course';

  return (
    <>
      <Head>
        <title>Art of Living - {courseTitle}</title>
        <meta
          name="description"
          content={`Art of Living - ${courseTitle} Course Registration`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </QueryClientProvider>
    </>
  );
}
