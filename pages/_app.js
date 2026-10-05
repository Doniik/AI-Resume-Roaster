import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '../components/ToastProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>
        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
      </ToastProvider>
    </SessionProvider>
  );
}