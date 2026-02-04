import React, { useState } from 'react';
import { applicationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiSearch, FiAlertCircle } from 'react-icons/fi';

const PublicVerification = () => {
  const [manualValue, setManualValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleManualVerify = async () => {
    if (!manualValue.trim()) {
      toast.error('Enter verification code');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await applicationsAPI.verifyByCode(manualValue.trim());
      setResult(response.data.data);
      toast.success('Verification successful');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Verify Certificate</h1>
        <p className="text-slate-300 mt-1">Enter the verification code found on your certificate to check status</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="text-gray-700 font-semibold flex items-center gap-2">
          <FiSearch className="w-5 h-5 text-gray-500" />
          Enter Verification Code
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            placeholder="e.g. SVS-VERIFIED-APP2026-..."
          />
          <button
            onClick={handleManualVerify}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-70 whitespace-nowrap"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          The code is located on the verified certificate or application details page.
        </p>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Verification Result</h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-gray-500">Application</span>
              <span className="font-semibold">{result.applicationNumber}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-gray-500">Scholarship</span>
              <span className="font-semibold">{result.scholarshipName}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-gray-500">Status</span>
              <span className="font-semibold capitalize text-green-600">{result.status}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-gray-500">Student</span>
              <span className="font-semibold">{result.studentName}</span>
            </div>
            {result.submittedAt && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-gray-500">Submitted</span>
                <span className="font-semibold">{new Date(result.submittedAt).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-gray-500">Code</span>
              <span className="font-mono text-sm">{result.verifiedVerificationCode || result.verificationCode || manualValue}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <FiCheckCircle className="w-5 h-5" /> Certificate is valid and authentic
          </div>
        </div>
      )}

      {loading === false && manualValue && !result && result !== null && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <FiXCircle className="w-5 h-5" /> No verification result found for this code
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicVerification;
