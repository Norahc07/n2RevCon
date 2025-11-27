import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed)
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(standalone);
      
      if (standalone) {
        setIsInstalled(true);
        return;
      }

      // Check if running from home screen on iOS
      if (iOS && window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }

      // Check localStorage flag
      if (localStorage.getItem('pwa-installed') === 'true') {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event (Chrome, Edge, Samsung Internet, etc.)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    // For iOS Safari - show install instructions if not installed
    if (iOS && !isInstalled && !isStandalone) {
      // Check if user agent supports PWA installation
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        // Show button for iOS with instructions
        setShowButton(true);
      }
    }

    // For Android Chrome, Edge, Firefox, etc.
    if (!iOS && !isInstalled) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    return () => {
      if (!iOS) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      }
    };
  }, [isInstalled, isStandalone]);

  const handleInstallClick = async () => {
    // iOS Safari - Show instructions
    if (isIOS) {
      // For iOS, we show instructions since we can't programmatically trigger install
      const instructions = `To install this app on your iOS device:
1. Tap the Share button (square with arrow) at the bottom
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" in the top right`;
      
      alert(instructions);
      return;
    }

    // Android/Desktop browsers with beforeinstallprompt support
    if (!deferredPrompt) {
      // Fallback: Try to show browser's native install prompt
      // This works for browsers that support it but didn't fire beforeinstallprompt
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
        setShowButton(false);
        localStorage.setItem('pwa-installed', 'true');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    } finally {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowButton(false);
    // Store dismissal in localStorage to prevent showing again for this session
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or if dismissed recently (within 24 hours)
  useEffect(() => {
    if (isInstalled) {
      setShowButton(false);
      return;
    }

    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setShowButton(false);
        return;
      }
    }

    // Show button if deferredPrompt is available
    if (deferredPrompt) {
      setShowButton(true);
    }
  }, [isInstalled, deferredPrompt]);

  if (!showButton || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-3 sm:p-4 max-w-xs w-[calc(100vw-2rem)] sm:w-auto">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg">
              <ArrowDownTrayIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Install n2 RevCon</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {isIOS 
                  ? 'Tap Share → Add to Home Screen' 
                  : 'Add to home screen for quick access'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors duration-200"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallButton;

