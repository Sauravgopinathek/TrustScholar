import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { FiFileText, FiEye, FiClock, FiCheckCircle, FiXCircle, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await applicationsAPI.getMyApplications();
      setApplications(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', icon: FiEdit },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FiClock },
      under_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FiClock },
      verified: { bg: 'bg-purple-100', text: 'text-purple-800', icon: FiCheckCircle },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: FiCheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: FiXCircle }
    };
    return badges[status] || badges.draft;
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['submitted', 'under_review'].includes(app.status);
    return app.status === filter;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">My Applications</h1>
          <p className="text-slate-300 mt-1">Track and manage your scholarship applications</p>
        </div>
        <Link
          to="/app/scholarships"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
        >
          + New Application
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'draft', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
              filter === f
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Scholarship
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((app) => {
                  const badge = getStatusBadge(app.status);
                  const StatusIcon = badge.icon;
                  
                  return (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                            <FiFileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">#{app.application_number}</p>
                            <p className="text-sm text-gray-500">ID: {app.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800">{app.scholarship_name}</p>
                        <p className="text-sm text-gray-500">
                          ₹{app.scholarship_amount?.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600">
                          {app.submitted_at ? formatDate(app.submitted_at) : formatDate(app.created_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-3">
                          <Link
                            to={`/app/application/${app.id}`}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            <FiEye className="w-4 h-4" />
                            View
                          </Link>
                          {app.status === 'draft' && (
                            <Link
                              to={`/app/application/${app.id}/edit`}
                              className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium"
                            >
                              <FiEdit className="w-4 h-4" />
                              Continue
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center">
          <FiFileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800">No Applications Found</h3>
          <p className="text-gray-500 mt-2">
            {filter === 'all' 
              ? "You haven't applied for any scholarships yet"
              : `No ${filter} applications found`
            }
          </p>
          <Link
            to="/app/scholarships"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
          >
            Browse Scholarships
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
