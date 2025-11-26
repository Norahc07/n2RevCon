import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const ChangePassword = () => {
  const { token } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid verification link');
      navigate('/settings/account');
    }
  }, [token, navigate]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return Math.min(strength, 5);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    if (e.target.name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return { text: 'Very Weak', color: 'text-red-600' };
    if (passwordStrength === 1) return { text: 'Weak', color: 'text-red-500' };
    if (passwordStrength === 2) return { text: 'Fair', color: 'text-yellow-500' };
    if (passwordStrength === 3) return { text: 'Good', color: 'text-blue-500' };
    if (passwordStrength === 4) return { text: 'Strong', color: 'text-green-600' };
    return { text: 'Very Strong', color: 'text-green-700' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await userAPI.changePasswordWithToken(token, {
        newPassword: formData.newPassword,
      });
      toast.success('Password changed successfully! Please login again.');
      // Logout if user is logged in, otherwise just navigate to login
      if (user) {
        await logout();
      }
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <LockClosedIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Change Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                required
                minLength={6}
                value={formData.newPassword}
                onChange={handlePasswordChange}
                className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength <= 1
                          ? 'bg-red-500'
                          : passwordStrength <= 2
                          ? 'bg-yellow-500'
                          : passwordStrength <= 3
                          ? 'bg-blue-500'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${getPasswordStrengthLabel().color}`}>
                    {getPasswordStrengthLabel().text}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use at least 8 characters with a mix of letters, numbers, and symbols
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                <CheckCircleIcon className="w-4 h-4" />
                <span>Passwords match</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || formData.newPassword !== formData.confirmPassword}
            className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;

