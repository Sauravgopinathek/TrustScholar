import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { applicationsAPI, documentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiCheckCircle, FiXCircle, FiClock, FiShield, FiFileText, 
  FiDownload, FiAlertCircle, FiUser, FiCalendar 
} from 'react-icons/fi';

const ApplicationDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docVerification, setDocVerification] = useState({});
  const [verifyingDocs, setVerifyingDocs] = useState({});
  const [statusComment, setStatusComment] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const response = await applicationsAPI.getById(id);
      setApplication(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch application');
    } finally {
      setLoading(false);
    }
  };

  const verifyDocument = async (docId) => {
    setVerifyingDocs((prev) => ({ ...prev, [docId]: true }));
    try {
      const response = await documentsAPI.verify(docId);
      setDocVerification((prev) => ({ ...prev, [docId]: response.data.data }));
      if (response.data.data?.verification?.signatureValid) {
        toast.success('Document integrity verified');
      } else {
        toast.error('Document integrity check failed');
      }
    } catch (error) {
      toast.error('Verification error');
    } finally {
      setVerifyingDocs((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const downloadDocument = async (docId, fileName) => {
    try {
      const response = await documentsAPI.getById(docId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await applicationsAPI.updateStatus(id, {
        status: newStatus,
        comments: statusComment
      });
      toast.success(`Application ${newStatus}`);
      fetchApplication();
      setStatusComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusInfo = (status) => {
    const info = {
      draft: { color: 'gray', icon: FiFileText, label: 'Draft' },
      submitted: { color: 'blue', icon: FiClock, label: 'Submitted' },
      under_review: { color: 'yellow', icon: FiClock, label: 'Under Review' },
      verified: { color: 'purple', icon: FiCheckCircle, label: 'Verified' },
      approved: { color: 'green', icon: FiCheckCircle, label: 'Approved' },
      rejected: { color: 'red', icon: FiXCircle, label: 'Rejected' }
    };
    return info[status] || info.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Application Not Found</h2>
      </div>
    );
  }

  const statusInfo = getStatusInfo(application.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-2xl shadow-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              Application #{application.application_number}
            </h1>
            <p className="text-slate-300 mt-1">{application.scholarship_name}</p>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
            <StatusIcon className="w-5 h-5" />
            <span className="font-medium">{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {user?.role === 'student' && application.verified_qr_code && application.status === 'verified' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <FiShield className="w-4 h-4 text-white" />
            </div>
            Verified Certificate QR
          </h2>
          <div className="text-center">
            <div className="inline-block p-4 bg-white border-2 border-emerald-200 rounded-xl shadow-md">
              <img src={application.verified_qr_code} alt="Verified QR" className="w-[150px] h-[150px]" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Scan to download verified certificate</p>
          </div>
        </div>
      )}

      {/* Application Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Application Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500">Applicant</label>
            <p className="font-medium text-gray-800 flex items-center gap-2 mt-1">
              <FiUser className="text-gray-400" />
              {application.student_name}
            </p>
          </div>
          
          <div>
            <label className="text-sm text-gray-500">Scholarship Amount</label>
            <p className="font-medium text-gray-800 mt-1">
              ₹{application.scholarship_amount?.toLocaleString()}
            </p>
          </div>
          
          <div>
            <label className="text-sm text-gray-500">GPA</label>
            <p className="font-medium text-gray-800 mt-1">{application.gpa || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-500">Submitted On</label>
            <p className="font-medium text-gray-800 flex items-center gap-2 mt-1">
              <FiCalendar className="text-gray-400" />
              {application.submitted_at 
                ? new Date(application.submitted_at).toLocaleDateString()
                : 'Not submitted'}
            </p>
          </div>
        </div>

        {application.personal_statement && (
          <div className="mt-6">
            <label className="text-sm text-gray-500">Personal Statement</label>
            <p className="mt-2 text-gray-700 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              {application.personal_statement}
            </p>
          </div>
        )}

        {['officer', 'admin'].includes(user?.role) && application.decrypted_data && (
          <div className="mt-6">
            <label className="text-sm text-gray-500">Decryption Details</label>
            <pre className="mt-2 text-sm text-gray-700 bg-slate-50 border border-slate-200 p-4 rounded-xl overflow-x-auto">
              {JSON.stringify(application.decrypted_data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Documents */}
      {application.documents?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Documents</h2>
          
          <div className="space-y-3">
            {application.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <FiFileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800 capitalize">
                      {doc.document_type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">{doc.original_filename}</p>
                    {docVerification[doc.id]?.verification && (
                      <p className={`text-xs mt-1 ${docVerification[doc.id].verification.signatureValid ? 'text-green-600' : 'text-red-600'}`}>
                        Integrity: {docVerification[doc.id].verification.signatureValid ? 'Valid' : 'Invalid'}
                      </p>
                    )}
                    {docVerification[doc.id]?.decryption && (
                      <p className="text-xs mt-1 text-gray-500">
                        Encryption: {docVerification[doc.id].decryption.algorithm} • IV: {docVerification[doc.id].decryption.iv}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <FiShield /> Encrypted
                  </span>
                  {['officer', 'admin'].includes(user?.role) && (
                    <>
                      <button
                        onClick={() => verifyDocument(doc.id)}
                        disabled={verifyingDocs[doc.id]}
                        className="text-xs px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-lg shadow-sm"
                      >
                        {verifyingDocs[doc.id] ? 'Verifying...' : 'Verify Integrity'}
                      </button>
                      <button
                        onClick={() => downloadDocument(doc.id, doc.original_filename)}
                        className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg shadow-sm"
                      >
                        <FiDownload className="inline mr-1" /> Download
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Actions (Officer/Admin) */}
      {['officer', 'admin'].includes(user?.role) && 
       ['submitted', 'under_review', 'verified'].includes(application.status) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Review Actions</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Comments
              </label>
              <textarea
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Add comments about your review..."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {application.status === 'submitted' && (
                <button
                  onClick={() => updateStatus('under_review')}
                  disabled={updating}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  Mark Under Review
                </button>
              )}
              
              {['submitted', 'under_review'].includes(application.status) && (
                <button
                  onClick={() => updateStatus('verified')}
                  disabled={updating}
                  className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  Verify Application
                </button>
              )}

              {['officer', 'admin'].includes(user?.role) && ['verified', 'under_review'].includes(application.status) && (
                <>
                  <button
                    onClick={() => updateStatus('approved')}
                    disabled={updating}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus('rejected')}
                    disabled={updating}
                    className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>

          {application.review_comments && (
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="font-medium text-gray-800 mb-2">Previous Comments</h3>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {application.review_comments}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;
