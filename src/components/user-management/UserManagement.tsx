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

// ─── Styles ─────────────────────────────────────────────────────────────────

const css = {
  // Layout
  page: {
    minHeight: '100vh',
    background: '#0b0f1a',
    color: '#e2e8f0',
    fontFamily: "'DM Sans', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  contentArea: {
    display: 'flex',
    minHeight: '100vh',
  } as React.CSSProperties,

  // Sidebar
  sidebar: {
    width: 260,
    background: '#0d1120',
    borderRight: '1px solid rgba(99, 102, 241, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 40,
  } as React.CSSProperties,
  sidebarLogo: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
  } as React.CSSProperties,
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 16,
    color: '#fff',
    letterSpacing: -0.5,
  } as React.CSSProperties,
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: -0.3,
  } as React.CSSProperties,
  logoSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 500,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginTop: 2,
  } as React.CSSProperties,
  navSection: {
    flex: 1,
    padding: '16px 12px',
    overflowY: 'auto' as const,
  } as React.CSSProperties,
  navLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    padding: '8px 12px 6px',
  } as React.CSSProperties,
  navItem: (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    color: active ? '#fff' : '#94a3b8',
    background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))' : 'transparent',
    border: active ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: 2,
    textDecoration: 'none',
  }) as React.CSSProperties,
  navIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center' as const,
  } as React.CSSProperties,
  sidebarFooter: {
    padding: '16px 16px',
    borderTop: '1px solid rgba(99, 102, 241, 0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as React.CSSProperties,
  footerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 12,
    color: '#fff',
    flexShrink: 0,
  } as React.CSSProperties,
  footerName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e2e8f0',
  } as React.CSSProperties,
  footerRole: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 500,
  } as React.CSSProperties,

  // Main content
  main: {
    marginLeft: 260,
    flex: 1,
    padding: '28px 32px',
    minHeight: '100vh',
  } as React.CSSProperties,
  header: {
    marginBottom: 28,
  } as React.CSSProperties,
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: -0.5,
    marginBottom: 4,
  } as React.CSSProperties,
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 400,
  } as React.CSSProperties,

  // Stats bar
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 28,
  } as React.CSSProperties,
  statCard: (accent: string) => ({
    background: '#111827',
    border: '1px solid rgba(99, 102, 241, 0.1)',
    borderRadius: 14,
    padding: '20px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  }) as React.CSSProperties,
  statIcon: (accent: string) => ({
    width: 44,
    height: 44,
    borderRadius: 12,
    background: `${accent}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  }) as React.CSSProperties,
  statValue: {
    fontSize: 26,
    fontWeight: 700,
    color: '#f1f5f9',
    lineHeight: 1,
  } as React.CSSProperties,
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 500,
    marginTop: 3,
  } as React.CSSProperties,

  // Tabs
  tabBar: {
    display: 'flex',
    gap: 0,
    marginBottom: 24,
    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
  } as React.CSSProperties,
  tab: (active: boolean) => ({
    padding: '12px 24px',
    fontSize: 13,
    fontWeight: 600,
    color: active ? '#a5b4fc' : '#64748b',
    borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid' as const,
    borderBottomColor: active ? '#6366f1' : 'transparent',
    transition: 'all 0.2s',
    letterSpacing: -0.2,
  }) as React.CSSProperties,

  // Toolbar
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  searchBox: {
    flex: 1,
    minWidth: 220,
    position: 'relative' as const,
  } as React.CSSProperties,
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    background: '#111827',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: 10,
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  searchIcon: {
    position: 'absolute' as const,
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 15,
    color: '#64748b',
    pointerEvents: 'none' as const,
  } as React.CSSProperties,
  filterSelect: {
    padding: '10px 14px',
    background: '#111827',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: 10,
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    minWidth: 140,
  } as React.CSSProperties,
  addBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'inherit',
    transition: 'opacity 0.2s, transform 0.1s',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  // Table
  tableWrap: {
    background: '#111827',
    border: '1px solid rgba(99, 102, 241, 0.1)',
    borderRadius: 14,
    overflow: 'hidden',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '14px 18px',
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    background: 'rgba(99, 102, 241, 0.04)',
    borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
  } as React.CSSProperties,
  td: {
    padding: '14px 18px',
    borderBottom: '1px solid rgba(99, 102, 241, 0.06)',
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,
  tr: (hover: boolean) => ({
    background: hover ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
    transition: 'background 0.15s',
  }) as React.CSSProperties,
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,
  avatar: (bg: string, size = 36) => ({
    width: size,
    height: size,
    borderRadius: 10,
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: size > 36 ? 18 : 12,
    color: '#fff',
    flexShrink: 0,
    letterSpacing: -0.3,
  }) as React.CSSProperties,
  userName: {
    fontWeight: 600,
    color: '#f1f5f9',
    fontSize: 13,
  } as React.CSSProperties,
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 400,
  } as React.CSSProperties,
  roleBadge: (color: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color: color,
    background: `${color}18`,
    border: `1px solid ${color}30`,
    letterSpacing: -0.1,
  }) as React.CSSProperties,
  statusDot: (active: boolean) => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: active ? '#10b981' : '#64748b',
    flexShrink: 0,
  }) as React.CSSProperties,
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 500,
  } as React.CSSProperties,
  actionBtn: (bg: string, color: string) => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    background: bg,
    border: 'none',
    color: color,
    fontSize: 14,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    fontFamily: 'inherit',
  }) as React.CSSProperties,
  actionsCell: {
    display: 'flex',
    gap: 6,
  } as React.CSSProperties,

  // Roles & Permissions tab
  rolesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 18,
  } as React.CSSProperties,
  roleCard: (borderColor: string) => ({
    background: '#111827',
    border: `1px solid ${borderColor}30`,
    borderRadius: 14,
    padding: 22,
  }) as React.CSSProperties,
  roleCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  } as React.CSSProperties,
  roleTitle: (color: string) => ({
    fontSize: 15,
    fontWeight: 700,
    color: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }) as React.CSSProperties,
  roleDot: (color: string) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
  }) as React.CSSProperties,
  roleUserCount: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 500,
  } as React.CSSProperties,
  permRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(99, 102, 241, 0.06)',
  } as React.CSSProperties,
  permLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: 500,
    textTransform: 'capitalize' as const,
  } as React.CSSProperties,
  toggle: (on: boolean, locked: boolean) => ({
    width: 38,
    height: 20,
    borderRadius: 12,
    background: locked ? '#374151' : on ? '#6366f1' : '#1e293b',
    border: `1px solid ${locked ? '#4b5563' : on ? '#818cf8' : '#334155'}`,
    position: 'relative' as const,
    cursor: locked ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
  }) as React.CSSProperties,
  toggleKnob: (on: boolean) => ({
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute' as const,
    top: 2,
    left: on ? 20 : 3,
    transition: 'left 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  }) as React.CSSProperties,
  lockedWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    marginTop: 14,
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: 500,
  } as React.CSSProperties,

  // Overlay / backdrop
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  // Drawer
  drawerBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 50,
  } as React.CSSProperties,
  drawer: {
    position: 'fixed' as const,
    top: 0,
    right: 0,
    bottom: 0,
    width: 420,
    background: '#0d1120',
    borderLeft: '1px solid rgba(99, 102, 241, 0.15)',
    zIndex: 51,
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '-8px 0 30px rgba(0,0,0,0.4)',
  } as React.CSSProperties,
  drawerHeader: {
    padding: '24px 24px 20px',
    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  drawerTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#f1f5f9',
  } as React.CSSProperties,
  drawerClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    color: '#94a3b8',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  drawerBody: {
    flex: 1,
    padding: 24,
    overflowY: 'auto' as const,
  } as React.CSSProperties,
  drawerProfile: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
    paddingBottom: 24,
    borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
  } as React.CSSProperties,
  drawerLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
  } as React.CSSProperties,
  drawerSelect: {
    width: '100%',
    padding: '10px 14px',
    background: '#111827',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: 10,
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  drawerSection: {
    marginBottom: 24,
  } as React.CSSProperties,
  permChips: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 8,
  } as React.CSSProperties,
  permChip: (active: boolean) => ({
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: active ? 'rgba(99, 102, 241, 0.15)' : 'rgba(51, 65, 85, 0.3)',
    color: active ? '#a5b4fc' : '#475569',
    border: `1px solid ${active ? 'rgba(99, 102, 241, 0.3)' : 'rgba(51, 65, 85, 0.4)'}`,
    textTransform: 'capitalize' as const,
  }) as React.CSSProperties,
  statusToggleBtns: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  } as React.CSSProperties,
  statusToggleBtn: (active: boolean, variant: 'active' | 'inactive') => ({
    flex: 1,
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    border: 'none',
    ...(variant === 'active'
      ? {
          background: active ? 'rgba(16, 185, 129, 0.15)' : '#111827',
          color: active ? '#34d399' : '#64748b',
          outline: active ? '2px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(99, 102, 241, 0.1)',
        }
      : {
          background: active ? 'rgba(239, 68, 68, 0.1)' : '#111827',
          color: active ? '#f87171' : '#64748b',
          outline: active ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(99, 102, 241, 0.1)',
        }),
  }) as React.CSSProperties,
  removeBtn: {
    width: '100%',
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    color: '#f87171',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
    marginTop: 12,
  } as React.CSSProperties,

  // Add User modal
  modal: {
    background: '#111827',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 18,
    width: '100%',
    maxWidth: 480,
    padding: 0,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  } as React.CSSProperties,
  modalHeader: {
    padding: '22px 24px',
    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#f1f5f9',
  } as React.CSSProperties,
  modalBody: {
    padding: 24,
  } as React.CSSProperties,
  modalInput: {
    width: '100%',
    padding: '11px 14px',
    background: '#0b0f1a',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: 10,
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  modalLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 6,
    display: 'block',
  } as React.CSSProperties,
  modalFooter: {
    padding: '16px 24px 22px',
    borderTop: '1px solid rgba(99, 102, 241, 0.08)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  } as React.CSSProperties,
  modalCancelBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 10,
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  // No results
  emptyState: {
    padding: 48,
    textAlign: 'center' as const,
    color: '#64748b',
    fontSize: 14,
  } as React.CSSProperties,
};

// ─── Nav Items ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard', key: 'dashboard' },
  { icon: '📦', label: 'Orders', key: 'orders' },
  { icon: '👕', label: 'Products', key: 'products' },
  { icon: '💳', label: 'Payments', key: 'payments' },
  { icon: '📈', label: 'Reports', key: 'reports' },
  { icon: '↩️', label: 'Returns', key: 'returns' },
  { icon: '👥', label: 'User Management', key: 'users' },
  { icon: '⭐', label: 'Ratings', key: 'ratings' },
  { icon: '⚙️', label: 'Settings', key: 'settings' },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function UserManagement() {
  // State
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

  // Edit drawer
  const [editUser, setEditUser] = useState<User | null>(null);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('ops_manager');

  // ─── Computed ──────────────────────────────────────────────────────────

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

  // ─── Handlers ─────────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div style={css.page}>
      <div style={css.contentArea}>
        {/* ── Sidebar ── */}
        <aside style={css.sidebar}>
          <div style={css.sidebarLogo}>
            <div style={css.logoMark}>IF</div>
            <div>
              <div style={css.logoText}>Insta Fashion</div>
              <div style={css.logoSub}>Seller Dashboard</div>
            </div>
          </div>

          <nav style={css.navSection}>
            <div style={css.navLabel}>Main Menu</div>
            {NAV_ITEMS.map(item => (
              <div key={item.key} style={css.navItem(item.key === 'users')}>
                <span style={css.navIcon}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>

          <div style={css.sidebarFooter}>
            <div style={css.footerAvatar}>RP</div>
            <div>
              <div style={css.footerName}>Ram Prasad Saw</div>
              <div style={css.footerRole}>Admin</div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={css.main}>
          {/* Header */}
          <div style={css.header}>
            <h1 style={css.headerTitle}>User Management</h1>
            <p style={css.headerSub}>
              Manage team members, roles, and access permissions
            </p>
          </div>

          {/* Stats Bar */}
          <div style={css.statsBar}>
            {[
              { label: 'Total Users', value: totalUsers, icon: '👥', accent: '#6366f1' },
              { label: 'Active', value: activeUsers, icon: '✅', accent: '#10b981' },
              { label: 'Inactive', value: inactiveUsers, icon: '⏸️', accent: '#f59e0b' },
              { label: 'Admin Accounts', value: adminCount, icon: '🛡️', accent: '#ef4444' },
            ].map(stat => (
              <div key={stat.label} style={css.statCard(stat.accent)}>
                <div style={css.statIcon(stat.accent)}>
                  <span>{stat.icon}</span>
                </div>
                <div>
                  <div style={css.statValue}>{stat.value}</div>
                  <div style={css.statLabel}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={css.tabBar}>
            <button
              style={css.tab(activeTab === 'users')}
              onClick={() => setActiveTab('users')}
            >
              👥 Users
            </button>
            <button
              style={css.tab(activeTab === 'roles')}
              onClick={() => setActiveTab('roles')}
            >
              🔐 Roles & Permissions
            </button>
          </div>

          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <>
              {/* Toolbar */}
              <div style={css.toolbar}>
                <div style={css.searchBox}>
                  <span style={css.searchIcon}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={css.searchInput}
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  style={css.filterSelect}
                >
                  <option value="all">All Roles</option>
                  {(Object.keys(ROLE_CONFIGS) as Role[]).map(r => (
                    <option key={r} value={r}>
                      {ROLE_CONFIGS[r].label}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={css.filterSelect}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button style={css.addBtn} onClick={() => setShowAddModal(true)}>
                  <span style={{ fontSize: 16 }}>+</span> Add User
                </button>
              </div>

              {/* Users Table */}
              <div style={css.tableWrap}>
                <table style={css.table}>
                  <thead>
                    <tr>
                      <th style={css.th}>User</th>
                      <th style={css.th}>Email</th>
                      <th style={css.th}>Role</th>
                      <th style={css.th}>Last Active</th>
                      <th style={css.th}>Status</th>
                      <th style={{ ...css.th, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={css.emptyState}>
                          No users found matching your filters
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => {
                        const rc = ROLE_CONFIGS[user.role];
                        return (
                          <tr
                            key={user.id}
                            style={css.tr(hoveredRow === user.id)}
                            onMouseEnter={() => setHoveredRow(user.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            <td style={css.td}>
                              <div style={css.userCell}>
                                <div style={css.avatar(user.avatarColor)}>
                                  {getInitials(user.name)}
                                </div>
                                <div>
                                  <div style={css.userName}>{user.name}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ ...css.td, color: '#94a3b8', fontSize: 13 }}>
                              {user.email}
                            </td>
                            <td style={css.td}>
                              <span style={css.roleBadge(rc.color)}>
                                <span style={{ ...css.roleDot(rc.color), width: 6, height: 6 }} />
                                {rc.label}
                              </span>
                            </td>
                            <td style={{ ...css.td, color: '#64748b', fontSize: 12 }}>
                              {user.lastActive}
                            </td>
                            <td style={css.td}>
                              <div style={css.statusCell}>
                                <div style={css.statusDot(user.status === 'active')} />
                                <span style={{ color: user.status === 'active' ? '#34d399' : '#94a3b8' }}>
                                  {user.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td style={{ ...css.td, textAlign: 'right' }}>
                              <div style={{ ...css.actionsCell, justifyContent: 'flex-end' }}>
                                <button
                                  style={css.actionBtn('rgba(99, 102, 241, 0.1)', '#818cf8')}
                                  title="Edit user"
                                  onClick={() => setEditUser(user)}
                                >
                                  ✏️
                                </button>
                                <button
                                  style={css.actionBtn(
                                    user.status === 'active'
                                      ? 'rgba(245, 158, 11, 0.1)'
                                      : 'rgba(16, 185, 129, 0.1)',
                                    user.status === 'active' ? '#fbbf24' : '#34d399'
                                  )}
                                  title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                  onClick={() => toggleStatus(user.id)}
                                >
                                  {user.status === 'active' ? '⏸' : '▶'}
                                </button>
                                {user.role !== 'admin' && (
                                  <button
                                    style={css.actionBtn('rgba(239, 68, 68, 0.1)', '#f87171')}
                                    title="Remove user"
                                    onClick={() => removeUser(user.id)}
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
            </>
          )}

          {/* ── Roles & Permissions Tab ── */}
          {activeTab === 'roles' && (
            <div style={css.rolesGrid}>
              {(Object.entries(ROLE_CONFIGS) as [Role, RoleConfig][]).map(([role, config]) => {
                const roleUsers = users.filter(u => u.role === role);
                return (
                  <div key={role} style={css.roleCard(config.color)}>
                    <div style={css.roleCardHeader}>
                      <div style={css.roleTitle(config.color)}>
                        <span style={css.roleDot(config.color)} />
                        {config.label}
                      </div>
                      <span style={css.roleUserCount}>
                        {roleUsers.length} user{roleUsers.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {ALL_PERMISSIONS.map(perm => {
                      const isOn = rolePermissions[role].includes(perm);
                      const isLocked = !!config.locked;
                      return (
                        <div key={perm} style={css.permRow}>
                          <span style={css.permLabel}>{perm}</span>
                          <div
                            style={css.toggle(isOn, isLocked)}
                            onClick={() => toggleRolePermission(role, perm)}
                          >
                            <div style={css.toggleKnob(isOn)} />
                          </div>
                        </div>
                      );
                    })}

                    {config.locked && (
                      <div style={css.lockedWarning}>
                        <span style={{ fontSize: 14 }}>🔒</span>
                        Admin permissions are locked and cannot be modified
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Edit User Drawer ── */}
      {editUser && (
        <>
          <div style={css.drawerBackdrop} onClick={() => setEditUser(null)} />
          <div style={css.drawer}>
            <div style={css.drawerHeader}>
              <span style={css.drawerTitle}>Edit User</span>
              <button style={css.drawerClose} onClick={() => setEditUser(null)}>
                ✕
              </button>
            </div>
            <div style={css.drawerBody}>
              {/* Profile */}
              <div style={css.drawerProfile}>
                <div style={css.avatar(editUser.avatarColor, 64)}>
                  {getInitials(editUser.name)}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
                  {editUser.name}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{editUser.email}</div>
              </div>

              {/* Role */}
              <div style={css.drawerSection}>
                <div style={css.drawerLabel}>Role</div>
                <select
                  style={css.drawerSelect}
                  value={editUser.role}
                  onChange={e => changeUserRole(editUser.id, e.target.value as Role)}
                  disabled={editUser.role === 'admin'}
                >
                  {(Object.keys(ROLE_CONFIGS) as Role[]).map(r => (
                    <option key={r} value={r}>
                      {ROLE_CONFIGS[r].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permissions preview */}
              <div style={css.drawerSection}>
                <div style={css.drawerLabel}>Permissions</div>
                <div style={css.permChips}>
                  {ALL_PERMISSIONS.map(perm => (
                    <span
                      key={perm}
                      style={css.permChip(rolePermissions[editUser.role].includes(perm))}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status toggle */}
              <div style={css.drawerSection}>
                <div style={css.drawerLabel}>Status</div>
                <div style={css.statusToggleBtns}>
                  <button
                    style={css.statusToggleBtn(editUser.status === 'active', 'active')}
                    onClick={() => toggleStatus(editUser.id)}
                  >
                    ✅ Active
                  </button>
                  <button
                    style={css.statusToggleBtn(editUser.status === 'inactive', 'inactive')}
                    onClick={() => toggleStatus(editUser.id)}
                  >
                    ⏸ Inactive
                  </button>
                </div>
              </div>

              {/* Remove */}
              {editUser.role !== 'admin' && (
                <button
                  style={css.removeBtn}
                  onClick={() => removeUser(editUser.id)}
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
        <div style={css.overlay} onClick={() => setShowAddModal(false)}>
          <div style={css.modal} onClick={e => e.stopPropagation()}>
            <div style={css.modalHeader}>
              <span style={css.modalTitle}>Add New User</span>
              <button style={css.drawerClose} onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <div style={css.modalBody}>
              <label style={css.modalLabel}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Amit Verma"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={css.modalInput}
              />

              <label style={css.modalLabel}>Email</label>
              <input
                type="email"
                placeholder="e.g. amit.verma@instafashion.in"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                style={css.modalInput}
              />

              <label style={css.modalLabel}>Assign Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as Role)}
                style={{ ...css.modalInput, cursor: 'pointer', marginBottom: 20 }}
              >
                {(Object.keys(ROLE_CONFIGS) as Role[])
                  .filter(r => r !== 'admin')
                  .map(r => (
                    <option key={r} value={r}>
                      {ROLE_CONFIGS[r].label}
                    </option>
                  ))}
              </select>

              <div style={css.drawerLabel}>Permissions Preview</div>
              <div style={css.permChips}>
                {ALL_PERMISSIONS.map(perm => (
                  <span
                    key={perm}
                    style={css.permChip(rolePermissions[newRole].includes(perm))}
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
            <div style={css.modalFooter}>
              <button
                style={css.modalCancelBtn}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...css.addBtn,
                  opacity: !newName.trim() || !newEmail.trim() ? 0.5 : 1,
                  cursor: !newName.trim() || !newEmail.trim() ? 'not-allowed' : 'pointer',
                }}
                onClick={addUser}
                disabled={!newName.trim() || !newEmail.trim()}
              >
                <span style={{ fontSize: 16 }}>+</span> Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
