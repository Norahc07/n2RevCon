import { useState, useEffect } from 'react';

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if running as PWA (installed app)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator.standalone === true) ||
                        document.referrer.includes('android-app://');

    // Only show splash screen if app is installed
    if (!isStandalone) {
      setIsVisible(false);
      return;
    }

    // Immediately set white background to override any default splash
    document.body.style.backgroundColor = '#FFFFFF';
    document.documentElement.style.backgroundColor = '#FFFFFF';

    // Start fade-in animation immediately
    setIsAnimating(true);

    // Hide splash screen after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Clean up styles
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    }, 2000); // Show for 2 seconds total

    return () => {
      clearTimeout(timer);
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: '#FFFFFF',
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
            src="/n2RevConLogo.png"
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

