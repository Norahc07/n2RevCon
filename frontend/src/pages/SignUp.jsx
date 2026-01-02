import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Name validation
  const validateName = (name, fieldName) => {
    if (!name.trim()) {
      return `${fieldName} is required`;
    }
    if (name.trim().length < 2) {
      return `${fieldName} must be at least 2 characters`;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    }
    return '';
  };

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
    if (password.length > 50) {
      return 'Password must be less than 50 characters';
    }
    // Check for at least one letter and one number
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
    newErrors.firstName = validateName(formData.firstName, 'First name');
    newErrors.lastName = validateName(formData.lastName, 'Last name');
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    newErrors.confirmPassword = validatePasswordMatch(formData.password, formData.confirmPassword);
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      !errors.firstName &&
      !errors.lastName &&
      !errors.email &&
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
      if (name === 'firstName') {
        setErrors(prev => ({ ...prev, firstName: validateName(value, 'First name') }));
      } else if (name === 'lastName') {
        setErrors(prev => ({ ...prev, lastName: validateName(value, 'Last name') }));
      } else if (name === 'email') {
        setErrors(prev => ({ ...prev, email: validateEmail(value) }));
      } else if (name === 'password') {
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
    
    if (name === 'firstName') {
      setErrors(prev => ({ ...prev, firstName: validateName(value, 'First name') }));
    } else if (name === 'lastName') {
      setErrors(prev => ({ ...prev, lastName: validateName(value, 'Last name') }));
    } else if (name === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    } else if (name === 'password') {
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
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true
    });
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      setLoading(false);
      
      if (result.success) {
        // Redirect to verification success page
        navigate('/signup-success', { 
          state: { 
            email: formData.email,
            verificationUrl: result.data?.verificationUrl 
          } 
        });
      } else {
        setErrors(prev => ({ 
          ...prev, 
          submit: result.message || result.error || 'Registration failed. Please try again.' 
        }));
      }
    } catch (error) {
      setLoading(false);
      setErrors(prev => ({ 
        ...prev, 
        submit: error.response?.data?.message || 'Registration failed. Please try again.' 
      }));
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100 lg:h-[700px] lg:max-w-[1120px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left Column - Gradient Background with Logo (Hidden on Mobile) */}
          <div className="hidden lg:flex bg-gradient-to-br from-red-600 via-red-500 to-red-700 items-center justify-center p-12">
            <div className="text-center">
              <div className="bg-white rounded-2xl p-8 mb-6 inline-block shadow-lg">
                <img 
                  src="/N2RevConLogo.png" 
                  alt="N2 RevCon Logo" 
                  className="h-24 w-auto mx-auto"
                />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">N2 RevCon</h1>
              <p className="text-white/90 text-lg">
                Join us and streamline your construction revenue management
              </p>
            </div>
          </div>

          {/* Right Column - Sign Up Form */}
          <div className="p-6 md:p-12 flex items-center justify-center min-h-[600px] lg:h-full">
            <div className="w-full max-w-md">
              {/* Mobile Logo - Only visible on mobile */}
              <div className="lg:hidden text-center mb-6">
                <div className="bg-white rounded-2xl p-6 mb-4 inline-block shadow-lg border-2 border-gray-200">
                  <img 
                    src="/N2RevConLogo.png" 
                    alt="N2 RevCon Logo" 
                    className="h-16 w-auto mx-auto"
                  />
                </div>
                <h1 className="text-2xl font-bold text-accent mb-2">N2 RevCon</h1>
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-accent">Sign Up</h2>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
                  title="Back to Home"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm font-medium hidden sm:inline">Home</span>
                </Link>
              </div>
              <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">Create your account to get started.</p>
              
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                        errors.firstName && touched.firstName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:border-red-600'
                      }`}
                      placeholder="First name"
                    />
                    {errors.firstName && touched.firstName && (
                      <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                        errors.lastName && touched.lastName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:border-red-600'
                      }`}
                      placeholder="Last name"
                    />
                    {errors.lastName && touched.lastName && (
                      <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                      errors.email && touched.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-red-600'
                    }`}
                    placeholder="Enter your company email"
                  />
                  {errors.email && touched.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
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
                        : 'border-gray-300 focus:border-red-600'
                    }`}
                    placeholder="Enter your password"
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
                        : 'border-gray-300 focus:border-red-600'
                    }`}
                    placeholder="Confirm your password"
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
                  className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Sign Up'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-red-600 font-semibold hover:underline"
                  >
                    Sign in
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

export default SignUp;
