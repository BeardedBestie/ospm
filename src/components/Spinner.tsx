import React from 'react';

export default function Spinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
    </div>
  );
}
