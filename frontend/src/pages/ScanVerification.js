import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { applicationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiCamera, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

const decodeBase64Payload = (value) => {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

const ScanVerification = () => {
  const scannerRef = useRef(null);
  const [manualValue, setManualValue] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    const onScanSuccess = async (text) => {
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;
      await handleDecoded(text);
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        () => {}
      )
      .catch((err) => {
        setScanError('Camera access failed. Use manual entry below.');
        console.error('QR start error:', err);
      });

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, []);

  const handleDecoded = async (value) => {
    setLoading(true);
    setResult(null);
    setDecoded(null);
    try {
      const payload = decodeBase64Payload(value);
      if (!payload?.code) {
        toast.error('Invalid QR payload');
        return;
      }
      setDecoded(payload);
      const response = await applicationsAPI.verifyByCode(payload.code);
      setResult(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async () => {
    if (!manualValue.trim()) {
      toast.error('Enter QR payload');
      return;
    }
    await handleDecoded(manualValue.trim());
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Scan Verification QR</h1>
        <p className="text-slate-300 mt-1">Scan the QR provided after verification to view scholarship status</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <FiCamera className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">Camera Scanner</span>
        </div>
        {scanError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <FiAlertCircle /> {scanError}
          </div>
        )}
        <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="text-gray-700 font-semibold">Manual QR Payload</div>
        <textarea
          rows={3}
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Paste the QR payload here"
        />
        <button
          onClick={handleManualVerify}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
        >
          Decode & Verify
        </button>
      </div>

      {decoded && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Decoded Payload</h2>
          <pre className="text-sm text-gray-700 bg-slate-50 border border-slate-200 p-4 rounded-xl overflow-x-auto">
            {JSON.stringify(decoded, null, 2)}
          </pre>
        </div>
      )}

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
              <span className="font-semibold capitalize">{result.status}</span>
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
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <FiCheckCircle className="w-5 h-5" /> Verified and decoded successfully
          </div>
        </div>
      )}

      {!result && !loading && decoded && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <FiXCircle className="w-5 h-5" /> No verification result found
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanVerification;
