'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = trackingNumber.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a tracking number');
      return;
    }
    if (trimmed.length < 6) {
      setError('Invalid tracking number format');
      return;
    }
    setIsLoading(true);
    setError('');
    router.push(`/track/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-2xl w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <span className="text-5xl">📦</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            SendIt
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-8">
            Track your package in real-time
          </p>
          
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter tracking number (e.g., SND-12345)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-3 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Searching...' : 'Track Package'}
              </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-lg transition backdrop-blur-sm border border-white/30"
            >
              📊 Go to Dashboard
            </Link>
            <Link
  href="/create"
  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg transition"
>
  ✈️ Send a Package
</Link>
          </div>
        </div>
      </div>
    </div>
  );
}