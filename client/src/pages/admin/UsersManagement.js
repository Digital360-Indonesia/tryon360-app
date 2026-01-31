import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, RefreshCw, Search, Plus, ChevronLeft, ChevronRight, Eye, Wallet } from 'lucide-react';
import { SharedHeader } from '../../components/shared/SharedHeader';
import Select from 'react-select';
import API_CONFIG from '../../config/api';
import '../Profile.css';

export default function UsersManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'tokens'

  // Get user data
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');

  // Check if user is admin
  useEffect(() => {
    if (!token) {
      navigate('/signup');
      return;
    }

    if (user.role !== 'admin') {
      alert('⛔ Akses ditolak! Halaman ini hanya untuk admin.');
      navigate('/app');
      return;
    }
  }, [navigate, token, user.role]);

  // Tabs config
  const tabs = [
    {
      id: 'users',
      label: 'Users',
      icon: Users,
    },
    {
      id: 'tokens',
      label: 'Token History',
      icon: Wallet,
    },
  ];

  return (
    <div className="profile-page-full">
      <SharedHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        showProfileDropdown={true}
      />

      <div className="profile-container-full">
        <div className="profile-content">
          {activeTab === 'users' ? <UsersTab token={token} /> : <TokensTab token={token} />}
        </div>
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ phoneNumber: '', name: '', password: '', role: 'user' });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  const fetchUsers = async (page = pagination.page) => {
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

  const createUser = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_CONFIG.getApiUrl()}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ User berhasil dibuat!');
        setShowCreateModal(false);
        setNewUser({ phoneNumber: '', name: '', password: '', role: 'user' });
        fetchUsers(pagination.page);
      } else {
        alert(`❌ Gagal: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      alert('❌ Gagal membuat user. Silakan coba lagi.');
    }
  };

  return (
    <div className="profile-content">
      <section className="profile-section">
        <div className="history-header">
          <h2 className="section-title">User Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="topup-button"
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Cari user (nama atau telepon)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
            <button
              type="submit"
              className="save-button"
              style={{ width: 'auto', marginTop: 0 }}
            >
              <Search className="w-4 h-4" />
              Cari
            </button>
            <button
              onClick={() => fetchUsers(pagination.page)}
              className="save-button"
              style={{ width: 'auto', marginTop: 0 }}
            >
              <RefreshCw className="w-4 h-4" />
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
        {loading ? (
          <div className="loading-state">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Telepon
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Nama
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Role
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Token Balance
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                      {searchTerm ? 'Tidak ada user yang cocok dengan pencarian' : 'Tidak ada user'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1e293b' }}>
                        {user.phoneNumber}
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1e293b' }}>
                        {user.name || '-'}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '20px',
                            backgroundColor: user.role === 'admin' ? '#f3e8ff' : '#f1f5f9',
                            color: user.role === 'admin' ? '#7c3aed' : '#475569'
                          }}
                        >
                          {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: user.tokens > 5 ? '#16a34a' : user.tokens > 0 ? '#ca8a04' : '#dc2626'
                        }}>
                          💰 {user.tokens}
                        </span>
                        {user.tokens === 0 && (
                          <span style={{ marginLeft: '8px', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>(HABIS)</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => addTokens(user.id, user.name || user.phoneNumber, user.tokens)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#16a34a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ➕ Token
                          </button>
                          <button
                            onClick={() => changeRole(user.id, user.name || user.phoneNumber, user.role)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#7c3aed',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            🔄 Role
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: '1px solid #e2e8f0', marginTop: '16px' }}>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} users
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                  opacity: pagination.page === 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                Halaman {pagination.page} dari {pagination.pages}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer',
                  opacity: pagination.page === pagination.pages ? 0.5 : 1
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px', margin: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Create New User</h2>
            <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Phone Number</label>
                <input
                  type="tel"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder="6281234567890"
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="User name"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-input"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="save-button"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="save-button"
                  style={{ backgroundColor: '#94a3b8' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Tokens Tab Component
function TokensTab({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchTransactions(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_CONFIG.getApiUrl()}/admin/users?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchTransactions = async (userId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${API_CONFIG.getApiUrl()}/admin/users/${userId}/transactions`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'added': return { bg: '#dcfce7', color: '#166534' };
      case 'used': return { bg: '#fee2e2', color: '#991b1b' };
      case 'refunded': return { bg: '#fef3c7', color: '#92400e' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div className="profile-content">
      <section className="profile-section">
        <h2 className="section-title">Token Transaction History</h2>

        {/* User Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>
            Select User
          </label>
          <Select
            value={users.find(u => u.id === selectedUserId) ? {
              value: users.find(u => u.id === selectedUserId).id,
              label: `${users.find(u => u.id === selectedUserId).name || users.find(u => u.id === selectedUserId).phoneNumber} (${users.find(u => u.id === selectedUserId).phoneNumber}) - ${users.find(u => u.id === selectedUserId).tokens} tokens`
            } : null}
            onChange={(selectedOption) => {
              if (selectedOption) {
                setSelectedUserId(selectedOption.value);
              } else {
                setSelectedUserId('');
              }
            }}
            options={users.map(user => ({
              value: user.id,
              label: `${user.name || user.phoneNumber} (${user.phoneNumber}) - ${user.tokens} tokens`
            }))}
            placeholder="Search and select a user..."
            isSearchable
            isClearable
            styles={{
              control: (provided) => ({
                ...provided,
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '4px 8px',
                fontSize: '15px',
                minHeight: '48px',
                '&:hover': {
                  borderColor: '#94a3b8'
                },
                '&:focus-within': {
                  borderColor: '#94a3b8',
                  boxShadow: '0 0 0 3px rgba(148, 163, 184, 0.1)'
                }
              }),
              placeholder: (provided) => ({
                ...provided,
                color: '#94a3b8'
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected ? '#1e293b' : state.isFocused ? '#f1f5f9' : 'white',
                color: state.isSelected ? 'white' : '#1e293b',
                padding: '12px 16px'
              }),
              menu: (provided) => ({
                ...provided,
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                zIndex: 10
              }),
              menuList: (provided) => ({
                ...provided,
                borderRadius: '12px',
                padding: '4px'
              }),
              singleValue: (provided) => ({
                ...provided,
                color: '#1e293b',
                fontSize: '15px'
              }),
              input: (provided) => ({
                ...provided,
                color: '#1e293b'
              })
            }}
          />
        </div>

        {error && (
          <div style={{ padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '24px' }}>
            <p style={{ color: '#991b1b', margin: 0 }}>{error}</p>
          </div>
        )}

        {!selectedUserId ? (
          <div className="empty-state">
            <Wallet className="w-16 h-16" style={{ color: '#d1d5db' }} />
            <p className="empty-state-text">Select a user to view token history</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <Eye className="w-16 h-16" style={{ color: '#d1d5db' }} />
            <p className="empty-state-text">No token transactions found</p>
          </div>
        ) : (
          <div className="history-list">
            {transactions.map((txn) => {
              const typeStyle = getTypeColor(txn.type);
              return (
                <div key={txn.id} className="history-item">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: typeStyle.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '20px'
                  }}>
                    {txn.type === 'added' ? '➕' : txn.type === 'refunded' ? '↩️' : '➖'}
                  </div>
                  <div className="history-item-details">
                    <h3 className="history-item-name">{txn.description}</h3>
                    <p className="history-item-date">
                      {new Date(txn.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="history-item-right">
                    <p className="history-item-amount" style={{
                      color: txn.type === 'added' ? '#16a34a' : txn.type === 'refunded' ? '#ca8a04' : '#dc2626'
                    }}>
                      {txn.type === 'added' ? '+' : txn.type === 'refunded' ? '↩️' : '-'}{txn.amount}
                    </p>
                    <span className={`history-status ${txn.type}`} style={{
                      backgroundColor: typeStyle.bg,
                      color: typeStyle.color
                    }}>
                      {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
