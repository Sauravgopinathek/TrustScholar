import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { FiCheckCircle, FiXCircle, FiShield, FiAlertCircle } from 'react-icons/fi';

const VerifyApplication = () => {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyApplication();
  }, [code]);

  const verifyApplication = async () => {
    try {
      const response = await applicationsAPI.verifyByCode(code);
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiXCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
              <p className="text-gray-600">{error}</p>
              <p className="text-sm text-gray-400 mt-4">Code: {code}</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Application Verified</h1>
              <p className="text-green-600 font-medium">This is an authentic application</p>
              
              <div className="mt-6 text-left space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-500">Application Number</label>
                  <p className="font-medium text-gray-800">{result?.applicationNumber}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-500">Scholarship</label>
                  <p className="font-medium text-gray-800">{result?.scholarshipName}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-500">Applicant</label>
                  <p className="font-medium text-gray-800">{result?.studentName}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="font-medium text-gray-800 capitalize">
                    {result?.status?.replace('_', ' ')}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-500">Submitted</label>
                  <p className="font-medium text-gray-800">
                    {result?.submittedAt 
                      ? new Date(result.submittedAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center gap-3">
                <FiShield className="w-6 h-6 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 text-left">
                  This application has been digitally signed and verified 
                  through TrustScholar.
                </p>
              </div>

              {result?.certificateAvailable && (
                <div className="mt-4">
                  <a
                    href={result.certificateDownloadUrl}
                    className="inline-flex items-center justify-center w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                  >
                    Download Verified Certificate
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-primary-200 text-sm mt-4">
          TrustScholar
        </p>
      </div>
    </div>
  );
};

export default VerifyApplication;
