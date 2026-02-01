import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scholarshipsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiAward, FiCalendar, FiDollarSign, FiUsers, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Scholarships = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    fetchScholarships();
  }, [pagination.page]);

  const fetchScholarships = async () => {
    try {
      const response = await scholarshipsAPI.getAll({ 
        page: pagination.page, 
        limit: 9,
        active_only: 'true'
      });
      const list = response.data.data.scholarships || [];
      setScholarships(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id);
      }
      setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
    } catch (error) {
      toast.error('Failed to fetch scholarships');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDeadlineSoon = (deadline) => {
    if (!deadline) return false;
    const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  const isExpired = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleApplySelected = () => {
    if (!selectedId) {
      toast.error('Please select a scholarship');
      return;
    }
    navigate(`/app/apply/${selectedId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Available Scholarships</h1>
        <p className="text-slate-300 mt-1">Browse and apply for scholarships that match your profile</p>
      </div>

      {user?.role === 'student' && scholarships.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Select Scholarship</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {scholarships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ₹{s.amount?.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:pt-6">
            <button
              onClick={handleApplySelected}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
            >
              Start Application
            </button>
          </div>
        </div>
      )}

      {/* Scholarships Grid */}
      {scholarships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scholarships.map((scholarship) => (
            <div 
              key={scholarship.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all group"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FiAward className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white line-clamp-1">{scholarship.name}</h3>
                    <p className="text-emerald-300 text-sm font-medium">{formatCurrency(scholarship.amount)}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-4">
                <p className="text-gray-600 text-sm line-clamp-2">
                  {scholarship.description || 'No description available'}
                </p>

                {/* Info Items */}
                <div className="space-y-2">
                  {scholarship.deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiCalendar className={`${isDeadlineSoon(scholarship.deadline) ? 'text-orange-500' : 'text-gray-400'}`} />
                      <span className={isDeadlineSoon(scholarship.deadline) ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                        Deadline: {formatDate(scholarship.deadline)}
                        {isDeadlineSoon(scholarship.deadline) && ' (Soon!)'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <FiUsers className="text-gray-400" />
                    <span className="text-gray-600">
                      Max Recipients: {scholarship.max_recipients || 1}
                    </span>
                  </div>
                </div>

                {/* Apply Button */}
                {user?.role === 'student' && !isExpired(scholarship.deadline) && (
                  <Link
                    to={`/app/apply/${scholarship.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-md shadow-emerald-500/20 transition-all group-hover:shadow-lg"
                  >
                    Apply Now
                    <FiArrowRight />
                  </Link>
                )}

                {isExpired(scholarship.deadline) && (
                  <div className="text-center py-2.5 bg-gray-100 text-gray-500 font-medium rounded-lg">
                    Application Closed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center">
          <FiAward className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800">No Scholarships Available</h3>
          <p className="text-gray-500 mt-2">Check back later for new opportunities</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
              className={`w-10 h-10 rounded-xl font-medium transition-all ${
                pagination.page === i + 1
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Scholarships;
