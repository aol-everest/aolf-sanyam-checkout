import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Layout } from "@/components/layout";

export default function App({ Component, pageProps }: AppProps) {
  // Get the current course title from page props if available
  const courseTitle =
    pageProps.course?.title ||
    pageProps.order?.courseTitle ||
    "Art of Living Course";

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
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
