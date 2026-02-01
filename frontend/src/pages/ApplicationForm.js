import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { scholarshipsAPI, applicationsAPI, documentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiFile, FiShield, FiLock, FiCheckCircle } from 'react-icons/fi';

const ApplicationForm = () => {
  const { scholarshipId, id: applicationIdParam } = useParams();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(null); // Track which doc is uploading
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (applicationIdParam) {
      loadExistingApplication();
    } else {
      fetchScholarship();
    }
  }, [scholarshipId, applicationIdParam]);

  const fetchScholarship = async () => {
    try {
      const response = await scholarshipsAPI.getById(scholarshipId);
      setScholarship(response.data.data);
    } catch (error) {
      toast.error('Scholarship not found');
      navigate('/app/scholarships');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingApplication = async () => {
    try {
      const appResponse = await applicationsAPI.getById(applicationIdParam);
      const app = appResponse.data.data;
      setApplicationId(app.id);

      // Populate form
      setValue('personal_statement', app.personal_statement || '');
      setValue('gpa', app.gpa || '');
      setValue('family_income', app.family_income || '');
      setValue('bank_account', app.decrypted_data?.bank_account || '');
      setValue('address', app.decrypted_data?.address || '');
      setValue('state', app.decrypted_data?.state || '');
      setValue('country', app.decrypted_data?.country || 'India');

      // Load scholarship info
      if (app.scholarship_name && app.scholarship_amount) {
        setScholarship({
          name: app.scholarship_name,
          amount: app.scholarship_amount,
          description: app.scholarship_description
        });
      } else if (app.scholarship_id) {
        const response = await scholarshipsAPI.getById(app.scholarship_id);
        setScholarship(response.data.data);
      }

      // Load existing docs
      if (Array.isArray(app.documents)) {
        setDocuments(app.documents.map((d) => ({
          id: d.id,
          type: d.document_type,
          name: d.original_filename
        })));
      }
    } catch (error) {
      toast.error('Failed to load application');
      navigate('/app/my-applications');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        scholarship_id: scholarshipId,
        personal_statement: data.personal_statement,
        gpa: data.gpa ? parseFloat(data.gpa) : null,
        family_income: data.family_income ? parseFloat(data.family_income) : null,
        sensitive_data: {
          bank_account: data.bank_account,
          address: data.address,
          state: data.state,
          country: data.country
        }
      };

      const appResponse = applicationId
        ? await applicationsAPI.update(applicationId, payload)
        : await applicationsAPI.create(payload);

      if (appResponse.data.success) {
        if (!applicationId) {
          setApplicationId(appResponse.data.data.id);
        }
        toast.success(applicationId ? 'Application updated!' : 'Application created! Now upload your documents.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingDoc(docType); // Set which document is uploading
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('application_id', applicationId);
      formData.append('document_type', docType);

      const response = await documentsAPI.upload(formData);
      
      if (response.data.success) {
        setDocuments([...documents, {
          id: response.data.data.id,
          type: docType,
          name: file.name,
          hash: response.data.data.hash
        }]);
        toast.success('Document encrypted with AES-256 & uploaded!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingDoc(null); // Clear uploading state
    }
  };

  const handleRemoveDocument = async (docId) => {
    try {
      await documentsAPI.delete(docId);
      setDocuments(documents.filter(d => d.id !== docId));
      toast.success('Document removed');
    } catch (error) {
      toast.error('Failed to remove document');
    }
  };

  const handleFinalSubmit = async () => {
    if (documents.length < 2) {
      toast.error('Please upload at least 2 required documents');
      return;
    }

    setSubmitting(true);
    try {
      const response = await applicationsAPI.submit(applicationId);
      
      if (response.data.success) {
        toast.success('Application submitted with digital signature!');
        navigate('/app/my-applications');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Scholarship Info */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">{scholarship?.name}</h1>
        <p className="text-slate-300 mt-2">{scholarship?.description}</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
            ₹{scholarship?.amount?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
          <FiShield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-blue-800">Secure Application</h3>
          <p className="text-sm text-blue-600 mt-1">
            Your data is encrypted with AES-256, and your application will be digitally signed 
            with your unique RSA key pair for authenticity verification.
          </p>
        </div>
      </div>

      {!applicationId ? (
        /* Step 1: Application Form */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Step 1: Application Details</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Statement *
              </label>
              <textarea
                {...register('personal_statement', { 
                  required: 'Personal statement is required',
                  minLength: { value: 100, message: 'Minimum 100 characters' }
                })}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Describe why you deserve this scholarship..."
              />
              {errors.personal_statement && (
                <p className="mt-1 text-sm text-red-500">{errors.personal_statement.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GPA (out of 10)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max="10"
                  {...register('gpa', { 
                    min: { value: 0, message: 'Invalid GPA' },
                    max: { value: 10, message: 'Maximum GPA is 10' }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="8.5"
                />
                {errors.gpa && (
                  <p className="mt-1 text-sm text-red-500">{errors.gpa.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Family Income (₹)
                </label>
                <input
                  type="number"
                  {...register('family_income')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="500000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  {...register('country')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  defaultValue="India"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  {...register('state')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Maharashtra"
                />
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiLock className="text-yellow-600" />
                <span className="font-medium text-yellow-800">Encrypted Fields</span>
              </div>
              <p className="text-sm text-yellow-700 mb-4">
                The following sensitive information will be encrypted before storage
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account Number (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('bank_account')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="For scholarship disbursement"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    {...register('address')}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Your full address"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Creating Application...' : 'Continue to Document Upload'}
            </button>
          </form>
        </div>
      ) : (
        /* Step 2: Document Upload */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <FiCheckCircle className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-800">Step 2: Upload Documents</h2>
          </div>

          <div className="space-y-4">
            {['transcript', 'id_proof', 'income_certificate', 'recommendation_letter'].map((docType) => {
              const uploaded = documents.find(d => d.type === docType);
              const isUploading = uploadingDoc === docType;
              return (
                <div key={docType} className={`border rounded-lg p-4 transition-all ${isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 capitalize">
                        {docType.replace('_', ' ')}
                        {['transcript', 'id_proof'].includes(docType) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </p>
                      {uploaded && (
                        <div className="mt-1">
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <FiCheckCircle />
                            {uploaded.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <FiLock className="w-3 h-3" />
                            Secured with AES-256 encryption
                          </p>
                        </div>
                      )}
                      {isUploading && (
                        <div className="mt-1">
                          <p className="text-sm text-blue-600 flex items-center gap-1">
                            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
                            Encrypting with AES-256 & generating SHA-512 hash...
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {uploaded ? (
                      <button
                        onClick={() => handleRemoveDocument(uploaded.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Remove document"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, docType)}
                          className="hidden"
                          disabled={uploadingDoc !== null}
                        />
                        <span className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                          isUploading 
                            ? 'bg-blue-100 text-blue-700 cursor-wait' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}>
                          {isUploading ? (
                            <>
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
                              Encrypting...
                            </>
                          ) : (
                            <>
                              <FiUpload />
                              Upload
                            </>
                          )}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <FiShield className="text-green-600" />
              <span className="font-medium text-green-800">Document Security Features</span>
            </div>
            <ul className="text-sm text-green-700 mt-2 space-y-1.5">
              <li className="flex items-center gap-2">
                <FiLock className="w-3.5 h-3.5" />
                <span><strong>AES-256-CBC</strong> encryption for document confidentiality</span>
              </li>
              <li className="flex items-center gap-2">
                <FiFile className="w-3.5 h-3.5" />
                <span><strong>SHA-512</strong> hash for file integrity verification</span>
              </li>
              <li className="flex items-center gap-2">
                <FiShield className="w-3.5 h-3.5" />
                <span><strong>RSA-2048</strong> digital signature for authenticity</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleFinalSubmit}
            disabled={submitting || documents.length < 2}
            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {submitting ? 'Signing & Submitting...' : 'Submit Application with RSA Digital Signature'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicationForm;
