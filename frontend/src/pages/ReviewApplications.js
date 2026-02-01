import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiFileText, FiClock, FiSearch, FiCheckCircle, FiXCircle, FiFilter } from 'react-icons/fi';

const ReviewApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', search: '' });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await applicationsAPI.getAll();
      setApplications(response.data.data.applications || []);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch applications';
      toast.error(message);
      console.error('Fetch applications error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredApplications = applications.filter(app =>
    (!filter.status || app.status === filter.status) && (
      app.application_number?.toLowerCase().includes(filter.search.toLowerCase()) ||
      app.student_name?.toLowerCase().includes(filter.search.toLowerCase()) ||
      app.scholarship_name?.toLowerCase().includes(filter.search.toLowerCase())
    )
  );

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
      <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Review Applications</h1>
        <p className="text-slate-300 mt-1">Verify and process scholarship applications</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['submitted', 'under_review', 'rejected', 'approved'].map(status => (
          <div key={status} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-gray-500 text-sm capitalize">{status.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-gray-800">
              {applications.filter(a => a.status === status).length}
            </p>
          </div>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scholarship</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApplications.map(app => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FiFileText className="text-gray-400" />
                      <span className="font-medium text-gray-800 font-mono">
                        {app.application_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{app.student_name}</td>
                  <td className="px-6 py-4 text-gray-600">{app.scholarship_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(app.status)}`}>
                      {app.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/app/application/${app.id}`}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="p-8 text-center">
            <FiFileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No applications found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewApplications;
