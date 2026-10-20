// components/InstallPrompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      console.log('User choice:', result.outcome);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4">
      <div className="flex items-start gap-3">
        <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
          <Download size={24} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-sm">Install SendIt</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Install this app on your device for faster access
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
            >
              Install
            </button>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}