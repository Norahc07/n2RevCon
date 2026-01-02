import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password validation
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (password.length > 50) {
      return 'Password must be less than 50 characters';
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain at least one letter and one number';
    }
    return '';
  };

  // Password match validation
  const validatePasswordMatch = (password, confirmPassword) => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  // Get password strength
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[@$!%*?&])/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'red' };
    if (strength <= 4) return { strength, label: 'Medium', color: 'yellow' };
    return { strength, label: 'Strong', color: 'green' };
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    newErrors.password = validatePassword(formData.password);
    newErrors.confirmPassword = validatePasswordMatch(formData.password, formData.confirmPassword);
    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.password &&
      formData.confirmPassword &&
      !errors.password &&
      !errors.confirmPassword
    );
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate on change if field has been touched
    if (touched[name]) {
      if (name === 'password') {
        setErrors(prev => ({ 
          ...prev, 
          password: validatePassword(value),
          confirmPassword: formData.confirmPassword ? validatePasswordMatch(value, formData.confirmPassword) : ''
        }));
      } else if (name === 'confirmPassword') {
        setErrors(prev => ({ ...prev, confirmPassword: validatePasswordMatch(formData.password, value) }));
      }
    }
  };

  // Handle blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (name === 'password') {
      setErrors(prev => ({ 
        ...prev, 
        password: validatePassword(value),
        confirmPassword: formData.confirmPassword ? validatePasswordMatch(value, formData.confirmPassword) : ''
      }));
    } else if (name === 'confirmPassword') {
      setErrors(prev => ({ ...prev, confirmPassword: validatePasswordMatch(formData.password, value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ password: true, confirmPassword: true });
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      navigate('/forgot-password');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, formData.password);
      setSuccess(true);
      toast.success('Password reset successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password. Please try again.';
      setErrors({ submit: message });
      toast.error(message);
      
      // If token is invalid or expired, redirect to forgot password
      if (error.response?.status === 400) {
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100">
          <div className="p-6 md:p-12 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-accent mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600 mb-4">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to login page...
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100">
        <div className="p-6 md:p-12">
          {/* Mobile Logo - Only visible on mobile */}
          <div className="lg:hidden text-center mb-6">
            <div className="bg-white rounded-2xl p-6 mb-4 inline-block shadow-lg border-2 border-gray-200">
              <img 
                src="/N2RevConLogo.png?v=2" 
                alt="N2 RevCon Logo" 
                className="h-16 w-auto mx-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-accent mb-2">N2 RevCon</h1>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-accent">Reset Password</h2>
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
          <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
            Enter your new password below.
          </p>

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                  errors.password && touched.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-primary'
                }`}
                placeholder="Enter your new password"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.color === 'red' ? 'bg-red-500' :
                          passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.color === 'red' ? 'text-red-600' :
                      passwordStrength.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must contain at least one letter and one number
                  </p>
                </div>
              )}
              {errors.password && touched.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                  errors.confirmPassword && touched.confirmPassword
                    ? 'border-red-500 focus:border-red-500'
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:border-primary'
                }`}
                placeholder="Confirm your new password"
              />
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting password...
                </span>
              ) : (
                'Reset Password'
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
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

