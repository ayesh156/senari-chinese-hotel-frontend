import { Loader2 } from 'lucide-react';

/**
 * Full-page loading spinner used as Suspense fallback.
 * Centered on screen with an amber-colored spinner.
 */
export default function LoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={36} className="text-amber-500 animate-spin" />
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Loading…</p>
      </div>
    </div>
  );
}