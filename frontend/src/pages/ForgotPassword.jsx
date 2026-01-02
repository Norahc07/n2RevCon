import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import logoImage from '../assets/N2RevConLogo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.forgotPassword(email);
      setSuccess(true);
      toast.success(response.data.message || 'Password reset link sent to your email');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100">
        <div className="p-6 md:p-12">
          {/* Mobile Logo - Only visible on mobile */}
          <div className="lg:hidden text-center mb-6">
            <div className="bg-white rounded-2xl p-6 mb-4 inline-block shadow-lg border-2 border-gray-200">
              <img 
                src={logoImage}
                alt="N2 RevCon Logo" 
                className="h-16 w-auto mx-auto"
                onError={(e) => {
                  if (!e.target.src.includes('/N2RevConLogo.png')) {
                    e.target.src = '/N2RevConLogo.png';
                  }
                }}
              />
            </div>
            <h1 className="text-2xl font-bold text-accent mb-2">N2 RevCon</h1>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-accent">Forgot Password</h2>
            <Link
              to="/login"
              className="text-gray-600 hover:text-primary transition-colors duration-200 flex items-center gap-2"
              title="Back to Login"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </Link>
          </div>

          {success ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-accent mb-2">Check Your Email</h3>
                <p className="text-gray-600 mb-4">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Please check your email and click on the link to reset your password. The link will expire in 1 hour.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Send Another Email
                </button>
                <Link
                  to="/login"
                  className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all duration-200"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors({});
                      }
                    }}
                    onBlur={(e) => {
                      const error = validateEmail(e.target.value);
                      if (error) {
                        setErrors({ email: error });
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-primary'
                    }`}
                    placeholder="Enter your company email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link 
                    to="/login" 
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

