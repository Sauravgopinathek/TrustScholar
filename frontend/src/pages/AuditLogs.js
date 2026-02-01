import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiShield, FiFilter, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ action: '', status: '' });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await usersAPI.getAuditLogs({ limit: 100 });
      setLogs(response.data.data?.logs || []);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800';
    if (action.includes('REGISTER')) return 'bg-green-100 text-green-800';
    if (action.includes('LOGOUT')) return 'bg-gray-100 text-gray-800';
    if (action.includes('APPLICATION')) return 'bg-purple-100 text-purple-800';
    if (action.includes('UNAUTHORIZED')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredLogs = logs.filter(log => {
    if (filter.action && !log.action.toLowerCase().includes(filter.action.toLowerCase())) return false;
    if (filter.status && log.status !== filter.status) return false;
    return true;
  });

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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <FiShield className="w-5 h-5 text-white" />
          </div>
          Security Audit Logs
        </h1>
        <p className="text-slate-300 mt-2 ml-12">Monitor all security events and user activities</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <FiFilter className="text-gray-400" />
          <input
            type="text"
            placeholder="Filter by action..."
            value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
          <button
            onClick={() => setFilter({ action: '', status: '' })}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800">{log.user_email || 'Anonymous'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 text-sm ${
                      log.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {log.status === 'success' ? (
                        <FiCheckCircle className="w-4 h-4" />
                      ) : (
                        <FiXCircle className="w-4 h-4" />
                      )}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {log.ipAddress || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
