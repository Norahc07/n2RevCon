import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided.');
        toast.error('Invalid verification link');
        return;
      }

      console.log('🔍 Verifying email with token:', token.substring(0, 20) + '...');
      
      try {
        const response = await authAPI.verifyEmail(token);
        console.log('✅ Verification response:', response);
        
        if (response && response.data) {
          setStatus('success');
          setMessage(response.data.message || 'Email verified successfully! Your account is now pending admin approval.');
          toast.success('Email verified successfully!', {
            duration: 5000,
            icon: '✅',
          });
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('❌ Verification error:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        
        setStatus('error');
        
        // Better error messages
        let errorMessage = 'Failed to verify email. Please try again.';
        
        if (error.response) {
          // Server responded with error
          errorMessage = error.response.data?.message || errorMessage;
          
          if (error.response.status === 400) {
            errorMessage = error.response.data?.message || 'Invalid or expired verification token.';
          } else if (error.response.status === 500) {
            errorMessage = 'Server error. Please try again later or contact support.';
          }
        } else if (error.request) {
          // Request was made but no response
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else {
          // Something else happened
          errorMessage = error.message || errorMessage;
        }
        
        setMessage(errorMessage);
        toast.error(errorMessage, {
          duration: 6000,
        });
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-8 md:p-12">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
                <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Verifying Your Email...</h1>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Email Verified!</h1>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 text-left">
                <p className="text-green-800">{message}</p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
                <p className="text-blue-800 font-semibold mb-2">⏳ What's Next?</p>
                <p className="text-blue-700 text-sm">
                  Your account is now pending administrator approval. You'll receive an email notification once your account has been approved. 
                  After approval, you'll be able to log in to the system.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-block w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Verification Failed</h1>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-left">
                <p className="text-red-800 font-medium mb-2">{message}</p>
                {message.includes('expired') && (
                  <p className="text-red-700 text-sm mt-2">
                    💡 You can request a new verification email from the login page.
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <Link
                  to="/login"
                  className="block w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                >
                  Go to Login
                </Link>
                {message.includes('expired') && (
                  <button
                    onClick={async () => {
                      // Extract email from URL or prompt user
                      const email = prompt('Please enter your email address to resend verification:');
                      if (email) {
                        try {
                          await authAPI.resendVerification(email);
                          toast.success('Verification email sent! Please check your inbox.');
                        } catch (error) {
                          toast.error(error.response?.data?.message || 'Failed to resend verification email');
                        }
                      }
                    }}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors text-center"
                  >
                    Resend Verification Email
                  </button>
                )}
                <Link
                  to="/signup"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-colors text-center"
                >
                  Sign Up Again
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

