import { useState, useEffect } from 'react';

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Immediately set white background to override any default splash - BEFORE any checks
    const setWhiteBackground = () => {
      // Set on document and body immediately
      if (document.documentElement) {
        document.documentElement.style.backgroundColor = '#FFFFFF';
        document.documentElement.style.background = '#FFFFFF';
        document.documentElement.setAttribute('style', 
          document.documentElement.getAttribute('style') + '; background-color: #FFFFFF !important; background: #FFFFFF !important;'
        );
      }
      if (document.body) {
        document.body.style.backgroundColor = '#FFFFFF';
        document.body.style.background = '#FFFFFF';
        document.body.setAttribute('style',
          document.body.getAttribute('style') + '; background-color: #FFFFFF !important; background: #FFFFFF !important;'
        );
      }
      
      // Remove any black background from images or elements
      const allImages = document.querySelectorAll('img');
      allImages.forEach(img => {
        if (img.src && (img.src.includes('icon') || img.src.includes('logo') || img.src.includes('splash'))) {
          img.style.backgroundColor = '#FFFFFF';
          img.style.background = '#FFFFFF';
        }
      });
      
      // Remove any default PWA splash screen elements
      const splashElements = document.querySelectorAll('[class*="splash"], [id*="splash"]');
      splashElements.forEach(el => {
        if (el !== document.querySelector('[data-custom-splash]')) {
          el.style.backgroundColor = '#FFFFFF';
          el.style.background = '#FFFFFF';
        }
      });
    };

    // Set immediately - highest priority
    setWhiteBackground();

    // Set multiple times to ensure it sticks
    requestAnimationFrame(setWhiteBackground);
    setTimeout(setWhiteBackground, 0);
    setTimeout(setWhiteBackground, 10);
    setTimeout(setWhiteBackground, 50);

    // Also set on DOMContentLoaded if not already loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setWhiteBackground);
    } else {
      setWhiteBackground();
    }

    // Check if running as PWA (installed app)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator.standalone === true) ||
                        document.referrer.includes('android-app://');

    // Only show splash screen if app is installed
    if (!isStandalone) {
      setIsVisible(false);
      return;
    }

    // Hide splash screen after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // Show for 2 seconds total

    return () => {
      clearTimeout(timer);
      document.removeEventListener('DOMContentLoaded', setWhiteBackground);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      data-custom-splash
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: '#FFFFFF !important',
        background: '#FFFFFF !important',
        animation: 'fadeIn 0.3s ease-in',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes logoScale {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .splash-logo {
          animation: logoScale 0.8s ease-out forwards;
        }
        .splash-title {
          animation: fadeInUp 0.6s ease-out 0.4s forwards;
          opacity: 0;
        }
      `}</style>
      
      <div className="flex flex-col items-center justify-center">
        {/* Logo with smooth scale and fade animation - white background container */}
        <div
          className="bg-white rounded-2xl p-6 shadow-lg splash-logo"
          style={{
            backgroundColor: '#FFFFFF',
          }}
        >
          <img
            src="/N2RevConLogo.png"
            alt="N2 RevCon Logo"
            className="w-32 h-32 md:w-40 md:h-40 object-contain"
            style={{
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
              mixBlendMode: 'normal',
            }}
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
            }}
          />
        </div>
        
        {/* App name with fade-in */}
        <div className="mt-6 splash-title">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">N2 RevCon</h1>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

