import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const SignUpSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-8 md:p-12">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">Registration Successful!</h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
            <p className="text-blue-800 font-semibold mb-2">📧 Check Your Email</p>
            <p className="text-blue-700 text-sm mb-2">
              We've sent a verification email to <strong>{email || 'your email address'}</strong>.
            </p>
            <p className="text-blue-700 text-sm">
              Please click the verification link in the email to verify your account.
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 text-left">
            <p className="text-yellow-800 font-semibold mb-2">⏳ Next Steps</p>
            <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
              <li>Verify your email address (click link in email)</li>
              <li>Wait for administrator approval</li>
              <li>You'll receive an email once your account is approved</li>
              <li>Then you can log in to the system</li>
            </ol>
          </div>

          {verificationUrl && process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6 text-left">
              <p className="text-gray-700 text-xs font-mono break-all">
                <strong>Dev Mode - Verification URL:</strong><br />
                {verificationUrl}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleResendVerification}
              disabled={resending || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>

            <Link
              to="/login"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-colors text-center"
            >
              Back to Login
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={handleResendVerification}
              disabled={resending || !email}
              className="text-blue-600 hover:underline font-semibold"
            >
              resend verification email
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpSuccess;

