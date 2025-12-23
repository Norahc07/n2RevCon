import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    remember: false 
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Email validation
  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  // Check if form is valid
  const isFormValid = () => {
    return formData.email && formData.password && !errors.email && !errors.password;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Validate in real-time when user types
    // If field has been touched, validate immediately
    // If field hasn't been touched but has an error, clear it when user starts typing
    if (touched[name]) {
      // Field has been touched, validate in real-time
      if (name === 'email') {
        const error = validateEmail(value);
        setErrors(prev => ({ ...prev, email: error }));
      } else if (name === 'password') {
        const error = validatePassword(value);
        setErrors(prev => ({ ...prev, password: error }));
      }
    } else if (errors[name]) {
      // Field hasn't been touched yet but has an error, clear it when user starts typing
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (name === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    } else if (name === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, remember: true }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);
    
    if (result.success) {
      if (formData.remember) {
        localStorage.setItem('rememberEmail', formData.email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      navigate('/dashboard');
    } else {
      // Handle different error types
      const errorMessage = result.message || result.error || 'Invalid email or password. Please try again.';
      
      // Check if it's an account status error
      let displayMessage = errorMessage;
      if (errorMessage.includes('verify your email')) {
        displayMessage = `Please verify your email address first. Check your inbox for the verification link.`;
      } else if (errorMessage.includes('pending approval')) {
        displayMessage = `Your account is pending administrator approval. You'll receive an email notification once your account has been approved.`;
      } else if (errorMessage.includes('rejected')) {
        displayMessage = `Your account registration has been rejected. Please contact support for more information.`;
      }
      
      setErrors(prev => ({ 
        ...prev, 
        submit: displayMessage
      }));
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-2 xs:p-4 md:p-6">
      <div className="w-full max-w-5xl bg-white rounded-xl xs:rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100 lg:h-[700px] lg:max-w-[1120px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left Column - Gradient Background with Logo (Hidden on Mobile) */}
          <div className="hidden lg:flex bg-gradient-to-br from-red-600 via-red-500 to-red-700 items-center justify-center p-12">
            <div className="text-center">
              <div className="bg-white rounded-2xl p-8 mb-6 inline-block shadow-lg">
                <img 
                  src="/n2RevConLogo.png" 
                  alt="N2 RevCon Logo" 
                  className="h-24 w-auto mx-auto"
                />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">N2 RevCon</h1>
              <p className="text-white/90 text-lg">
                Construction Revenue Recognition and Measurement Made Simple
              </p>
            </div>
          </div>

          {/* Right Column - Sign In Form */}
          <div className="p-4 xs:p-6 md:p-12 flex items-center justify-center min-h-[450px] xs:min-h-[500px] lg:h-full">
            <div className="w-full max-w-md">
              {/* Mobile Logo - Only visible on mobile */}
              <div className="lg:hidden text-center mb-4 xs:mb-6">
                <div className="bg-white rounded-xl xs:rounded-2xl p-4 xs:p-6 mb-3 xs:mb-4 inline-block shadow-lg border-2 border-gray-200">
                  <img 
                    src="/n2RevConLogo.png" 
                    alt="N2 RevCon Logo" 
                    className="h-12 xs:h-16 w-auto mx-auto"
                  />
                </div>
                <h1 className="text-xl xs:text-2xl font-bold text-accent mb-2">N2 RevCon</h1>
              </div>

              <div className="flex items-center justify-between mb-4 xs:mb-6">
                <h2 className="text-xl xs:text-2xl md:text-3xl font-bold text-accent">Sign In</h2>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-red-600 transition-colors duration-200 flex items-center gap-1 xs:gap-2"
                  title="Back to Home"
                >
                  <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-xs xs:text-sm font-medium hidden xs:inline">Home</span>
                </Link>
              </div>
              <p className="text-gray-600 mb-4 xs:mb-6 md:mb-8 text-xs xs:text-sm md:text-base text-center xs:text-left">Welcome back! Please sign in to your account.</p>
              
              {errors.submit && (
                <div className="mb-3 xs:mb-4 p-2.5 xs:p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-xs xs:text-sm text-red-600 text-center">{errors.submit}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5 md:space-y-6">
                <div>
                  <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-1.5 xs:mb-2">
                    Company Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                      errors.email && touched.email
                        ? 'border-red-500 focus:border-red-500'
                        : formData.email && !errors.email
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:border-red-600'
                    }`}
                    placeholder="Enter your company email"
                  />
                  {errors.email && touched.email && (
                    <p className="mt-1 text-xs xs:text-sm text-red-600 animate-fade-in">{errors.email}</p>
                  )}
                  {formData.email && !errors.email && touched.email && (
                    <p className="mt-1 text-xs xs:text-sm text-green-600 animate-fade-in">✓ Valid email</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-1.5 xs:mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                      errors.password && touched.password
                        ? 'border-red-500 focus:border-red-500'
                        : formData.password && !errors.password
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:border-red-600'
                    }`}
                    placeholder="Enter your password"
                  />
                  {errors.password && touched.password && (
                    <p className="mt-1 text-xs xs:text-sm text-red-600 animate-fade-in">{errors.password}</p>
                  )}
                  {formData.password && !errors.password && touched.password && (
                    <p className="mt-1 text-xs xs:text-sm text-green-600 animate-fade-in">✓ Valid password</p>
                  )}
                </div>

                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3">
                  <label className="flex items-center justify-center xs:justify-start">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={formData.remember}
                      onChange={handleChange}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-600 focus:ring-2"
                    />
                    <span className="ml-2 text-xs xs:text-sm text-gray-700">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs xs:text-sm text-red-600 font-semibold hover:underline text-center xs:text-right"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white font-semibold py-2.5 xs:py-3 text-sm xs:text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 xs:mr-3 h-4 w-4 xs:h-5 xs:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-4 xs:mt-6 text-center">
                <p className="text-xs xs:text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="text-red-600 font-semibold hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
