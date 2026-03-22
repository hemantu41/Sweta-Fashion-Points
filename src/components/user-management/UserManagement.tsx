'use client';

import { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

type Role = 'admin' | 'ops_manager' | 'catalogue_manager' | 'finance';
type Status = 'active' | 'inactive';
type PermissionModule = 'dashboard' | 'orders' | 'products' | 'finance' | 'reports' | 'returns' | 'users' | 'ratings' | 'settings';
type TabType = 'users' | 'roles';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  lastActive: string;
  avatarColor: string;
}

interface RoleConfig {
  label: string;
  color: string;
  permissions: PermissionModule[];
  locked?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ALL_PERMISSIONS: PermissionModule[] = [
  'dashboard', 'orders', 'products', 'finance', 'reports', 'returns', 'users', 'ratings', 'settings',
];

const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  admin: {
    label: 'Admin',
    color: '#ef4444',
    permissions: [...ALL_PERMISSIONS],
    locked: true,
  },
  ops_manager: {
    label: 'Ops Manager',
    color: '#f97316',
    permissions: ['dashboard', 'orders', 'products', 'returns', 'reports'],
  },
  catalogue_manager: {
    label: 'Catalogue Manager',
    color: '#8b5cf6',
    permissions: ['dashboard', 'products', 'ratings'],
  },
  finance: {
    label: 'Finance',
    color: '#10b981',
    permissions: ['dashboard', 'finance', 'reports'],
  },
};

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f97316', '#3b82f6', '#14b8a6'];

const SEED_USERS: User[] = [
  { id: 'u1', name: 'Rahul Sharma', email: 'rahul.sharma@instafashion.in', role: 'admin', status: 'active', lastActive: '2 min ago', avatarColor: AVATAR_COLORS[0] },
  { id: 'u2', name: 'Priya Mehta', email: 'priya.mehta@instafashion.in', role: 'ops_manager', status: 'active', lastActive: '15 min ago', avatarColor: AVATAR_COLORS[1] },
  { id: 'u3', name: 'Vikram Singh', email: 'vikram.singh@instafashion.in', role: 'catalogue_manager', status: 'active', lastActive: '1 hr ago', avatarColor: AVATAR_COLORS[2] },
  { id: 'u4', name: 'Anjali Tiwari', email: 'anjali.tiwari@instafashion.in', role: 'finance', status: 'active', lastActive: '3 hrs ago', avatarColor: AVATAR_COLORS[3] },
  { id: 'u5', name: 'Suresh Kumar', email: 'suresh.kumar@instafashion.in', role: 'ops_manager', status: 'inactive', lastActive: '5 days ago', avatarColor: AVATAR_COLORS[4] },
  { id: 'u6', name: 'Meena Patel', email: 'meena.patel@instafashion.in', role: 'catalogue_manager', status: 'active', lastActive: '30 min ago', avatarColor: AVATAR_COLORS[5] },
  { id: 'u7', name: 'Deepak Rao', email: 'deepak.rao@instafashion.in', role: 'finance', status: 'inactive', lastActive: '2 weeks ago', avatarColor: AVATAR_COLORS[6] },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<Role, PermissionModule[]>>({
    admin: [...ROLE_CONFIGS.admin.permissions],
    ops_manager: [...ROLE_CONFIGS.ops_manager.permissions],
    catalogue_manager: [...ROLE_CONFIGS.catalogue_manager.permissions],
    finance: [...ROLE_CONFIGS.finance.permissions],
  });

  const [editUser, setEditUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('ops_manager');

  // Computed
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status === 'inactive').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handlers
  const toggleStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
    if (editUser?.id === userId) {
      setEditUser(prev =>
        prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
      );
    }
  };

  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (editUser?.id === userId) setEditUser(null);
  };

  const changeUserRole = (userId: string, newRoleVal: Role) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRoleVal } : u)));
    if (editUser?.id === userId) {
      setEditUser(prev => (prev ? { ...prev, role: newRoleVal } : null));
    }
  };

  const toggleRolePermission = (role: Role, perm: PermissionModule) => {
    if (ROLE_CONFIGS[role].locked) return;
    setRolePermissions(prev => {
      const current = prev[role];
      const next = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
      return { ...prev, [role]: next };
    });
  };

  const addUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const newUser: User = {
      id: `u${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: 'active',
      lastActive: 'Just now',
      avatarColor: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
    };
    setUsers(prev => [newUser, ...prev]);
    setNewName('');
    setNewEmail('');
    setNewRole('ops_manager');
    setShowAddModal(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage team members, roles, and access permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <span className="text-base">+</span> Add User
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: totalUsers, icon: '👥', bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { label: 'Active', value: activeUsers, icon: '✅', bg: 'bg-green-50', text: 'text-green-600' },
          { label: 'Inactive', value: inactiveUsers, icon: '⏸️', bg: 'bg-amber-50', text: 'text-amber-600' },
          { label: 'Admin Accounts', value: adminCount, icon: '🛡️', bg: 'bg-red-50', text: 'text-red-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center text-lg`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-[11px] text-gray-400 font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['users', 'roles'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {tab === 'users' ? '👥 Users' : '🔐 Roles & Permissions'}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-w-[140px] cursor-pointer"
            >
              <option value="all">All Roles</option>
              {(Object.keys(ROLE_CONFIGS) as Role[]).map(r => (
                <option key={r} value={r}>{ROLE_CONFIGS[r].label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-w-[130px] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                        No users found matching your filters
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const rc = ROLE_CONFIGS[user.role];
                      return (
                        <tr
                          key={user.id}
                          className={`border-b border-gray-50 transition-colors ${hoveredRow === user.id ? 'bg-gray-50/70' : ''}`}
                          onMouseEnter={() => setHoveredRow(user.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ background: user.avatarColor }}
                              >
                                {getInitials(user.name)}
                              </div>
                              <span className="font-semibold text-gray-800 text-sm">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={{
                                color: rc.color,
                                background: `${rc.color}12`,
                                border: `1px solid ${rc.color}30`,
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: rc.color }} />
                              {rc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{user.lastActive}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span className={`text-xs font-medium ${user.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                                {user.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditUser(user)}
                                title="Edit"
                                className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-100 transition-colors text-sm"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => toggleStatus(user.id)}
                                title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-sm
                                  ${user.status === 'active' ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                              >
                                {user.status === 'active' ? '⏸' : '▶'}
                              </button>
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => removeUser(user.id)}
                                  title="Remove"
                                  className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors text-sm"
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Roles & Permissions Tab ── */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(Object.entries(ROLE_CONFIGS) as [Role, RoleConfig][]).map(([role, config]) => {
            const roleUsers = users.filter(u => u.role === role);
            return (
              <div
                key={role}
                className="bg-white rounded-xl border border-gray-100 p-5"
                style={{ borderLeftWidth: 3, borderLeftColor: config.color }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: config.color }} />
                    <span className="text-sm font-bold text-gray-800">{config.label}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {roleUsers.length} user{roleUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-0">
                  {ALL_PERMISSIONS.map(perm => {
                    const isOn = rolePermissions[role].includes(perm);
                    const isLocked = !!config.locked;
                    return (
                      <div key={perm} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-600 font-medium capitalize">{perm}</span>
                        <button
                          onClick={() => toggleRolePermission(role, perm)}
                          disabled={isLocked}
                          className={`w-9 h-5 rounded-full relative transition-all flex-shrink-0
                            ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                            ${isOn ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all shadow-sm"
                            style={{ left: isOn ? 18 : 3 }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {config.locked && (
                  <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <span className="text-sm">🔒</span>
                    <span className="text-[11px] text-red-600 font-medium">Admin permissions are locked and cannot be modified</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit User Drawer ── */}
      {editUser && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setEditUser(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[51] shadow-2xl flex flex-col border-l border-gray-100">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Edit User</h3>
              <button
                onClick={() => setEditUser(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Profile */}
              <div className="flex flex-col items-center gap-2 pb-6 border-b border-gray-100">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: editUser.avatarColor }}
                >
                  {getInitials(editUser.name)}
                </div>
                <p className="text-base font-semibold text-gray-800">{editUser.name}</p>
                <p className="text-xs text-gray-400">{editUser.email}</p>
              </div>

              {/* Role */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Role</label>
                <select
                  value={editUser.role}
                  onChange={e => changeUserRole(editUser.id, e.target.value as Role)}
                  disabled={editUser.role === 'admin'}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(Object.keys(ROLE_CONFIGS) as Role[]).map(r => (
                    <option key={r} value={r}>{ROLE_CONFIGS[r].label}</option>
                  ))}
                </select>
              </div>

              {/* Permissions preview */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Permissions</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PERMISSIONS.map(perm => {
                    const active = rolePermissions[editUser.role].includes(perm);
                    return (
                      <span
                        key={perm}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize
                          ${active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-50 text-gray-400 border border-gray-100'
                          }`}
                      >
                        {perm}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Status toggle */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (editUser.status !== 'active') toggleStatus(editUser.id); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border
                      ${editUser.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    ✅ Active
                  </button>
                  <button
                    onClick={() => { if (editUser.status !== 'inactive') toggleStatus(editUser.id); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border
                      ${editUser.status === 'inactive'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    ⏸ Inactive
                  </button>
                </div>
              </div>

              {/* Remove */}
              {editUser.role !== 'admin' && (
                <button
                  onClick={() => removeUser(editUser.id)}
                  className="w-full py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  🗑 Remove User
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Add New User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amit Verma"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
                <input
                  type="email"
                  placeholder="e.g. amit.verma@instafashion.in"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Assign Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as Role)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {(Object.keys(ROLE_CONFIGS) as Role[])
                    .filter(r => r !== 'admin')
                    .map(r => (
                      <option key={r} value={r}>{ROLE_CONFIGS[r].label}</option>
                    ))}
                </select>
              </div>

              {/* Permissions preview */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Permissions Preview</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PERMISSIONS.map(perm => {
                    const active = rolePermissions[newRole].includes(perm);
                    return (
                      <span
                        key={perm}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize
                          ${active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-50 text-gray-400 border border-gray-100'
                          }`}
                      >
                        {perm}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-500 font-medium hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addUser}
                disabled={!newName.trim() || !newEmail.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-base">+</span> Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
