import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import API_CONFIG from '../../config/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');

  // Check if user is admin
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const user = JSON.parse(localStorage.getItem('user')) || {};
      setCurrentUser(user);

      if (!token) {
        navigate('/signup');
        return;
      }

      if (user.role !== 'admin') {
        alert('⛔ Akses ditolak! Halaman ini hanya untuk admin.');
        navigate('/app');
        return;
      }

      fetchUsers();
    };

    checkAuth();
  }, [navigate, token]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(
        `${API_CONFIG.getApiUrl()}/admin/users?page=${page}&limit=${pagination.limit}${searchParam}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const addTokens = async (userId, userName, currentTokens) => {
    const amount = prompt(`Tambah token untuk ${userName}\n\nToken saat ini: ${currentTokens}\n\nMasukkan jumlah token yang ingin ditambahkan:`);

    if (amount === null || amount === '') return;

    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('⚠️ Masukkan angka yang valid!');
      return;
    }

    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Tambah ${numAmount} token untuk ${userName}?`)) return;

    try {
      const response = await fetch(`${API_CONFIG.getApiUrl()}/admin/users/${userId}/tokens`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: numAmount })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}\n\nToken: ${data.previousTokens} → ${data.newTokens}`);
        fetchUsers(pagination.page);
      } else {
        alert(`❌ Gagal: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to add tokens:', err);
      alert('❌ Gagal menambahkan token. Silakan coba lagi.');
    }
  };

  const changeRole = async (userId, userName, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Ubah role ${userName} dari "${currentRole}" ke "${newRole}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.getApiUrl()}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Role berhasil diubah ke ${newRole}`);
        fetchUsers(pagination.page);
      } else {
        alert(`❌ Gagal: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to change role:', err);
      alert('❌ Gagal mengubah role. Silakan coba lagi.');
    }
  };

  const viewTransactions = async (userId, userName) => {
    try {
      const response = await fetch(
        `${API_CONFIG.getApiUrl()}/admin/users/${userId}/transactions`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const transactions = data.data;
        let message = `📊 Token History - ${userName}\n\n`;

        transactions.forEach((t, index) => {
          const icon = t.type === 'added' ? '+' : t.type === 'refunded' ? '↩️' : '-';
          const color = t.type === 'added' ? 'Hijau' : t.type === 'refunded' ? 'Kuning' : 'Merah';
          message += `${index + 1}. ${icon} ${t.amount} token (${color})\n`;
          message += `   ${t.description}\n`;
          message += `   ${new Date(t.createdAt).toLocaleString('id-ID')}\n\n`;
        });

        alert(message);
      } else {
        alert(`📊 Token History - ${userName}\n\nBelum ada transaksi.`);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      alert('❌ Gagal memuat history transaksi.');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-1">Kembali ke Profile</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-2">Kelola user dan token</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Cari user (nama atau telepon)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              🔍 Cari
            </button>
            <button
              onClick={() => fetchUsers(pagination.page)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telepon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bergabung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'Tidak ada user yang cocok dengan pencarian' : 'Tidak ada user'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-bold ${
                          user.tokens > 5 ? 'text-green-600' : user.tokens > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          💰 {user.tokens}
                        </span>
                        {user.tokens === 0 && (
                          <span className="ml-2 text-xs text-red-500 font-semibold">(HABIS)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => addTokens(user.id, user.name || user.phoneNumber, user.tokens)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-semibold"
                            disabled={loading}
                          >
                            ➕ Token
                          </button>
                          <button
                            onClick={() => changeRole(user.id, user.name || user.phoneNumber, user.role)}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-xs font-semibold"
                            disabled={loading || user.id === currentUser?.id}
                          >
                            🔄 Role
                          </button>
                          <button
                            onClick={() => viewTransactions(user.id, user.name || user.phoneNumber)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-semibold"
                          >
                            📊 History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-1 bg-white border border-gray-300 rounded">
                  Halaman {pagination.page} dari {pagination.pages}
                </span>
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{pagination.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">👑 Admins</h3>
            <p className="text-3xl font-bold text-purple-600">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">👤 Regular Users</h3>
            <p className="text-3xl font-bold text-gray-600">
              {users.filter(u => u.role === 'user').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
