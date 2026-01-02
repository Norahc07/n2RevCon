import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import PWAInstallButton from '../components/PWAInstallButton';

// Typing Animation Component
const TypingAnimation = ({ text, speed = 100, deleteSpeed = 50, delay = 2000, startDelay = 0, syncDelay = 0 }) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    // Initial delay before starting
    const startTimer = setTimeout(() => {
      setIsStarted(true);
    }, startDelay);

    return () => clearTimeout(startTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!isStarted) return;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentIndex < text.length) {
          setDisplayText(text.substring(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        } else {
          // Finished typing, wait then start deleting (with sync delay for shorter words)
          setTimeout(() => setIsDeleting(true), delay + syncDelay);
        }
      } else {
        // Deleting
        if (currentIndex > 0) {
          setDisplayText(text.substring(0, currentIndex - 1));
          setCurrentIndex(currentIndex - 1);
        } else {
          // Finished deleting, start typing again
          setIsDeleting(false);
        }
      }
    }, isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timer);
  }, [currentIndex, isDeleting, text, speed, deleteSpeed, delay, syncDelay, isStarted]);

  return <span className="inline-block">{displayText}<span className="animate-pulse text-red-600">|</span></span>;
};

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const cardsRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Scroll animation for cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCardsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardsRef.current) {
      observer.observe(cardsRef.current);
    }

    return () => {
      if (cardsRef.current) {
        observer.unobserve(cardsRef.current);
      }
    };
  }, []);

  const features = [
    {
      icon: '📊',
      title: 'Project Tracking',
      description: 'Efficiently monitor and manage all your construction projects from start to finish with real-time updates and comprehensive reporting.',
      delay: '0.1s'
    },
    {
      icon: '💰',
      title: 'Revenue Recognition',
      description: 'Streamline revenue recognition and measurement processes in compliance with financial reporting standards and regulations.',
      delay: '0.2s'
    },
    {
      icon: '📈',
      title: 'Cost Management',
      description: 'Track expenses, manage budgets, and analyze costs to ensure optimal financial performance across all projects.',
      delay: '0.3s'
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Geometric Shapes */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-red-500/5 via-red-600/5 to-red-700/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-red-500/5 via-red-600/5 to-red-700/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-red-500/3 via-red-600/3 to-red-700/3 rounded-full blur-3xl"></div>
        
        {/* Construction Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Diagonal Lines */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diagonal" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0,100 L100,0" stroke="currentColor" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal)"/>
          </svg>
        </div>

        {/* Floating Construction Icons */}
        <div className="absolute top-32 right-32 text-6xl opacity-5 animate-float">🏗️</div>
        <div className="absolute bottom-40 left-40 text-5xl opacity-5 animate-float-delayed">📐</div>
        <div className="absolute top-1/3 right-1/4 text-4xl opacity-5 animate-float-slow">🔨</div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b-2 border-gray-100 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <img 
                src="/N2RevConLogo.png" 
                alt="N2 RevCon Logo" 
                className="h-8 md:h-10 w-auto"
              />
              <h1 className="text-lg md:text-2xl font-bold text-accent">N2 RevCon</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Link
                to="/login"
                className="sign-in-btn text-sm md:text-base text-accent font-medium relative transition-all duration-200 group"
              >
                <span className="relative z-10">Sign In</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 via-red-500 to-red-700 group-hover:w-full transition-all duration-200"></span>
              </Link>
              <Link
                to="/signup"
                className="sign-up-btn bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all duration-200 shadow-lg"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-12 md:py-20 px-4 md:px-6 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className={`text-3xl md:text-5xl lg:text-6xl font-bold text-accent mb-4 md:mb-6 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <span className="inline-flex items-baseline flex-wrap justify-center gap-1">
                  <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">Con</span>
                  <span className="inline-block min-w-[140px] md:min-w-[200px] lg:min-w-[240px] text-left">
                    <TypingAnimation text="struction" speed={100} deleteSpeed={50} delay={2000} startDelay={500} syncDelay={0} />
                  </span>
                  <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">Rev</span>
                  <span className="inline-block min-w-[60px] md:min-w-[80px] lg:min-w-[100px] text-left">
                    <TypingAnimation text="enue" speed={100} deleteSpeed={50} delay={2000} startDelay={500} syncDelay={500} />
                  </span>
                  <span className="whitespace-nowrap">Recognition and Measurement</span>
                </span>
                <br />
                <span className="whitespace-nowrap">Made Simple</span>
              </h1>
              <p className={`text-base md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed transition-all duration-500 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                A system designed to streamline how construction firms track construction projects, recognize and measure revenue, manage costs, and ensure compliance with financial reporting standards.
              </p>
              <Link
                to="/signup"
                className={`get-started-btn inline-block bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg shadow-lg transition-all duration-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: '0.4s' }}
              >
                Get Started
              </Link>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-12 md:py-20 px-4 md:px-6 relative">
            <div className="max-w-7xl mx-auto" ref={cardsRef}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`relative flex justify-center transition-all duration-500 ease-out ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                    style={{ 
                      transitionDelay: feature.delay,
                    }}
                  >
                    {/* Simple Card */}
                    <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-xl w-full max-w-sm mx-auto">
                      {/* Top Accent Line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-700 rounded-t-2xl"></div>
                      
                      {/* Content - Centered */}
                      <div className="relative z-10 text-center">
                        {/* Icon */}
                        <div className="text-5xl md:text-6xl mb-4 md:mb-6 inline-block">
                          {feature.icon}
                        </div>
                        
                        <h3 className="text-xl md:text-2xl font-bold text-accent mb-3 md:mb-4">
                          {feature.title}
                        </h3>
                        <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="bg-accent text-white py-8 md:py-12 px-4 md:px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
              {/* Brand Section */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">N2 RevCon</h3>
                <p className="text-white/80 text-sm">
                  Professional construction revenue management system for RSBP Engineering and Services.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="/security" className="text-white/80 hover:text-white transition-colors duration-200">
                      Security
                    </a>
                  </li>
                  <li>
                    <a href="/privacy" className="text-white/80 hover:text-white transition-colors duration-200">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-white/80 hover:text-white transition-colors duration-200">
                      Terms
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact Us */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
                <ul className="space-y-3 text-white/80 text-sm">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>BLOCK 3 LOT 36, JASMINE ST., VM TOWNHOMES, BRGY. PUTATAN MUNTINLUPA CITY, 1772</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>(02) 8252-6739; 0915-5039276</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:rsbp.engineering@yahoo.com" className="hover:text-white transition-colors duration-200">
                      rsbp.engineering@yahoo.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-white/20 pt-8 mt-8 text-center">
              <p className="text-white/80 text-sm">
                © 2025 N2 RevCon – SLSU College of Administration, Business, Hospitality and Accountancy. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(-5deg);
          }
        }
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(3deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        /* Get Started Button - Simple Zoom and Color Change */
        .get-started-btn {
          transition: all 0.2s ease-out;
        }
        
        .get-started-btn:hover {
          transform: scale(1.05);
        }
        
        /* Sign In Button - Smooth Hover */
        .sign-in-btn {
          will-change: color;
        }
        
        .sign-in-btn:hover {
          transform: translateY(-1px);
        }
        
        /* Sign Up Button - Simple Zoom and Color Change */
        .sign-up-btn {
          transition: all 0.2s ease-out;
        }
        
        .sign-up-btn:hover {
          transform: scale(1.05);
        }
      `}</style>
      {/* PWA Install Button - Only on Landing Page */}
      <PWAInstallButton />
    </div>
  );
};

export default LandingPage;
