import NextErrorComponent, { ErrorProps } from 'next/error';
import Head from 'next/head';
import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { NextPageContext } from 'next';
import Image from 'next/image';

interface ErrorIconProps {
  statusCode: number;
}

interface ErrorDetailsProps {
  err?: {
    message?: string;
    stack?: string;
  };
}

interface ServerErrorProps {
  err?: {
    message?: string;
    stack?: string;
  };
}

interface MyErrorProps {
  statusCode: number;
  hasGetInitialPropsRun: boolean;
  err?: {
    message?: string;
    stack?: string;
  };
}

const ErrorIcon = memo<ErrorIconProps>(({ statusCode }) => {
  return (
    <div className="relative w-24 h-24">
      <Image
        src="/images/med-error.svg"
        alt={`Error ${statusCode}`}
        width={96}
        height={96}
        priority
      />
    </div>
  );
});

ErrorIcon.displayName = 'ErrorIcon';

const ErrorDetails = ({ err }: ErrorDetailsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!err?.message && !err?.stack) return null;

  return (
    <div className="mt-6 w-full max-w-2xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
        aria-label="Toggle error details"
        aria-expanded={isExpanded}
      >
        <svg
          className={`w-3 h-3 mr-1.5 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Technical Details
      </button>

      {isExpanded && (
        <div
          className="mt-2 p-3 bg-gray-50/50 rounded-md font-mono text-xs overflow-auto border border-gray-100"
          role="region"
          aria-label="Error details"
        >
          <div className="text-red-600 font-medium">{err.message}</div>
          {err.stack && (
            <pre className="mt-2 text-gray-600 whitespace-pre-wrap text-[11px]">
              {err.stack}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

const ServerError = ({ err }: ServerErrorProps) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-lg">
        <div className="flex justify-center">
          <ErrorIcon statusCode={500} />
        </div>

        <h1 className="text-4xl font-bold mt-6 text-gray-800">500</h1>

        <h2 className="mt-2 text-lg text-gray-600">
          An error occurred on server
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

        <ErrorDetails err={err} />
      </div>
    </div>
  );
};

const MyError = ({ statusCode, err }: MyErrorProps) => {
  if (process.env.NODE_ENV !== 'production' && err) {
    console.error(err);
  }

  if (statusCode === 500) {
    return <ServerError err={err} />;
  }

  const errorMessage =
    statusCode === 404
      ? 'This page could not be found'
      : 'An error occurred on server';

  return (
    <>
      <Head>
        <title>{`Error ${statusCode || 500} | Art of Living`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="flex justify-center">
            <ErrorIcon statusCode={statusCode} />
          </div>

          <h1 className="text-4xl font-bold mt-6 text-gray-800">
            {statusCode || 500}
          </h1>

          <h2 className="mt-2 text-lg text-gray-600">{errorMessage}</h2>

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

          <ErrorDetails err={err} />
        </div>
      </div>
    </>
  );
};

interface CustomErrorProps extends ErrorProps {
  err?: {
    message?: string;
    stack?: string;
  };
  hasGetInitialPropsRun?: boolean;
}

MyError.getInitialProps = async ({
  res,
  err,
}: NextPageContext): Promise<CustomErrorProps> => {
  const errorInitialProps = (await NextErrorComponent.getInitialProps({
    res,
    err,
  } as NextPageContext)) as CustomErrorProps;

  // If it's a 500 error, set the status code
  if (res?.statusCode === 500) {
    errorInitialProps.statusCode = 500;
  }

  // Include error message in all environments
  errorInitialProps.err = {
    message: err?.message,
    stack: err?.stack,
  };

  errorInitialProps.hasGetInitialPropsRun = true;

  return errorInitialProps;
};

export default MyError;
