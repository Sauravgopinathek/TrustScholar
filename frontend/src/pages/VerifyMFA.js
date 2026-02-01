import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiShield, FiLock } from 'react-icons/fi';

const VerifyMFA = () => {
  const { verifyMFA, resendOTP } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const tempToken = sessionStorage.getItem('tempToken');
  const email = sessionStorage.getItem('mfaEmail');

  useEffect(() => {
    if (!tempToken || !email) {
      navigate('/login');
    }
  }, [tempToken, email, navigate]);

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
      const result = await verifyMFA(tempToken, otpCode);
      if (result.success) {
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('mfaEmail');
        toast.success('Login successful!');
        navigate('/app/dashboard');
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
      await resendOTP(email, 'login');
      toast.success('New OTP sent to your email');
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
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Two-Factor Authentication</h1>
          <p className="text-slate-300 mt-2">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-emerald-400">{email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</span>
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <FiLock className="text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium">
              Password verified successfully
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <p className="text-center text-slate-400 mb-4">
              Step 2: Enter your OTP code
            </p>
            
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
              {loading ? 'Verifying...' : 'Complete Login'}
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

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-300">
              <strong>🔐 Security Notice:</strong> This extra verification step 
              protects your account from unauthorized access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyMFA;
