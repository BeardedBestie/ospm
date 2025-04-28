import React from 'react';

interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="w-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-lg mb-4">
      {message}
    </div>
  );
}
