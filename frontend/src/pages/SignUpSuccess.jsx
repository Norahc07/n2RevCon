import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const SignUpSuccess = () => {
  const location = useLocation();
  const { email, verificationUrl } = location.state || {};
  const [resending, setResending] = useState(false);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Email not found');
      return;
    }

    setResending(true);
    try {
      await authAPI.resendVerification(email);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-700 px-8 py-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Registration Successful!</h1>
          <p className="text-red-100 text-sm">Your account has been created</p>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {/* Email Verification Step */}
          <div className="mb-6">
            <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Email</h3>
                <p className="text-gray-700 text-sm mb-3">
                  We've sent a verification email to <strong className="text-gray-900">{email || 'your email address'}</strong>.
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  Click the verification link in the email to activate your account.
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={resending || !email}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resending ? 'Sending...' : "Didn't receive it? Resend email"}
                </button>
              </div>
            </div>
          </div>

          {/* Admin Approval Step */}
          <div className="mb-6">
            <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Wait for Approval</h3>
                <p className="text-gray-700 text-sm mb-2">
                  After verifying your email, an administrator will review and approve your account.
                </p>
                <p className="text-gray-600 text-sm">
                  You'll receive an email notification once your account has been approved. Then you can log in!
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Check your spam folder if you don't see the email. The verification link expires in 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Dev Mode URL */}
          {verificationUrl && process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-700">
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Development Mode</p>
              <p className="text-xs text-green-400 font-mono break-all">
                {verificationUrl}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpSuccess;

