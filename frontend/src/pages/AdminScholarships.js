import React, { useState, useEffect } from 'react';
import { scholarshipsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiAward, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const AdminScholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    eligibility_criteria: '',
    deadline: '',
    max_recipients: 1
  });

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      const response = await scholarshipsAPI.getAll({ active_only: 'false' });
      setScholarships(response.data.data.scholarships || []);
    } catch (error) {
      toast.error('Failed to fetch scholarships');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await scholarshipsAPI.update(editingId, formData);
        toast.success('Scholarship updated');
      } else {
        await scholarshipsAPI.create(formData);
        toast.success('Scholarship created');
      }
      setShowModal(false);
      resetForm();
      fetchScholarships();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (scholarship) => {
    setFormData({
      name: scholarship.name,
      description: scholarship.description || '',
      amount: scholarship.amount,
      eligibility_criteria: scholarship.eligibility_criteria || '',
      deadline: scholarship.deadline?.split('T')[0] || '',
      max_recipients: scholarship.max_recipients || 1
    });
    setEditingId(scholarship.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this scholarship?')) {
      try {
        await scholarshipsAPI.delete(id);
        toast.success('Scholarship deactivated');
        fetchScholarships();
      } catch (error) {
        toast.error('Failed to delete scholarship');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      eligibility_criteria: '',
      deadline: '',
      max_recipients: 1
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Manage Scholarships</h1>
          <p className="text-slate-300 mt-1">Create and manage scholarship programs</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
        >
          <FiPlus /> Add Scholarship
        </button>
      </div>

      {/* Scholarships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scholarships.map((scholarship) => (
          <div 
            key={scholarship.id} 
            className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow ${!scholarship.is_active ? 'opacity-60' : ''}`}
          >
            <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FiAward className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{scholarship.name}</h3>
                    <p className="text-emerald-300 font-medium">₹{scholarship.amount?.toLocaleString()}</p>
                  </div>
                </div>
                {!scholarship.is_active && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-lg">Inactive</span>
                )}
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {scholarship.description || 'No description'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Deadline: {scholarship.deadline 
                    ? new Date(scholarship.deadline).toLocaleDateString() 
                    : 'None'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(scholarship)}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(scholarship.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Scholarship' : 'Create Scholarship'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Recipients</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_recipients}
                    onChange={(e) => setFormData({ ...formData, max_recipients: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</label>
                <textarea
                  rows={2}
                  value={formData.eligibility_criteria}
                  onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScholarships;
