import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiShield } from 'react-icons/fi';

const VerifyEmail = () => {
  const { verifyEmail, resendOTP } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const email = sessionStorage.getItem('verifyEmail');

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp;
    
    if (otpCode.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmail(email, otpCode);
      if (result.success) {
        toast.success('Email verified successfully!');
        sessionStorage.removeItem('verifyEmail');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP(email, 'registration');
      toast.success('OTP resent to your email');
      setResendTimer(60);
      setCanResend(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl shadow-lg shadow-emerald-500/25 mb-4">
            <FiMail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Verify Your Email</h1>
          <p className="text-slate-300 mt-2">
            We've sent a 6-digit code to<br />
            <span className="font-medium text-emerald-400">{email}</span>
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700">
          <form onSubmit={handleSubmit}>
            {/* OTP Input - Single Box */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2 text-center">Enter 6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                autoFocus
                className="w-full h-16 text-center text-3xl font-bold tracking-[0.5em] bg-slate-900/50 border-2 border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition placeholder:text-slate-600 placeholder:tracking-[0.5em]"
              />
              <p className="text-xs text-slate-500 text-center mt-2">Enter or paste your 6-digit code</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Resend OTP
                </button>
              ) : (
                <span className="text-slate-500">Resend in {resendTimer}s</span>
              )}
            </p>
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-sm text-amber-300">
              <strong>⏱️ Note:</strong> The OTP expires in 5 minutes. 
              Check your spam folder if you don't see the email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
