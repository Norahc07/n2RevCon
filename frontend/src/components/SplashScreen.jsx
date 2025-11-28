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

    // Start fade-in animation
    setTimeout(() => {
      setIsAnimating(true);
    }, 50);

    // Hide splash screen after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // Show for 2 seconds total

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundColor: '#FFFFFF',
      }}
    >
      <div className="flex flex-col items-center justify-center">
        {/* Logo with smooth scale and fade animation - white background container */}
        <div
          className={`bg-white rounded-2xl p-6 shadow-lg transform transition-all duration-700 ease-out ${
            isAnimating
              ? 'scale-100 opacity-100'
              : 'scale-75 opacity-0'
          }`}
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
        <div
          className={`mt-6 transition-all duration-700 delay-300 ${
            isAnimating
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">N2 RevCon</h1>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

