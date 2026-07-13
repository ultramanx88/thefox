'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  DatabaseZap,
  History,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Store,
  UserPlus,
  UsersRound
} from 'lucide-react';

type Role = 'customer' | 'vendor' | 'driver' | 'admin' | 'superadmin';
type TenantStatus = 'pending' | 'active' | 'suspended';
type BranchStatus = 'pending' | 'active' | 'paused' | 'closed';

type AdminUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
  authAccounts: Array<{
    provider: string;
    providerUserId: string;
  }>;
  vendorMemberships: Array<{
    tenantId: string;
    role: string;
    tenant: {
      name: string;
      slug: string;
      status: string;
    };
  }>;
  driverProfile: {
    id: string;
    status: string;
    serviceArea: string | null;
  } | null;
};

type AuditLog = {
  id: string;
  actorUserId: string | null;
  actorRole: Role | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  route: string | null;
  method: string | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: string;
  actorUser: {
    email: string | null;
    displayName: string | null;
  } | null;
};

type AuditPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type AuditLogsPayload = {
  data: AuditLog[];
  pagination: AuditPagination;
};

type AdminMe = {
  user: {
    id: string;
    displayName: string;
    email: string | null;
    role: Role;
  };
  mutationToken: string;
  permissions: {
    canReviewTenants: boolean;
    canInspectOrders: boolean;
    canManageRoles: boolean;
  };
};

type AdminTenant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  memberships: Array<{
    id: string;
    role: string;
    createdAt: string;
    user: {
      id: string;
      email: string | null;
      displayName: string | null;
      role: Role;
    };
  }>;
  branches: Array<{
    id: string;
    name: string;
    slug: string;
    status: BranchStatus;
    address: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  _count: {
    branches: number;
    memberships: number;
    products: number;
  };
};

type LoadState = 'loading' | 'ready' | 'error';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const roles: Role[] = ['customer', 'vendor', 'driver', 'admin', 'superadmin'];
const tenantStatuses: TenantStatus[] = ['pending', 'active', 'suspended'];
const branchStatuses: BranchStatus[] = ['pending', 'active', 'paused', 'closed'];
const membershipRoles = ['owner', 'admin', 'member'];
const auditPageSizeOptions = [10, 25, 50, 100];
const auditResourceTypes = ['user', 'tenant', 'branch', 'audit_log', 'auth_session', 'admin_workspace', 'vendor_workspace', 'driver_workspace'];

const roleLabels: Record<Role, string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  driver: 'Driver',
  admin: 'Admin',
  superadmin: 'Superadmin'
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

function roleClassName(role: Role) {
  return `fox-role-pill fox-role-pill--${role}`;
}

function statusClassName(status: TenantStatus | BranchStatus) {
  return `fox-status-pill fox-status-pill--${status}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function isMutationRequest(init?: RequestInit) {
  const method = init?.method?.toUpperCase() ?? 'GET';
  return method !== 'GET' && method !== 'HEAD';
}

async function fetchJson<T>(path: string, init?: RequestInit, mutationToken?: string) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(isMutationRequest(init) && mutationToken ? { 'X-TheFox-Mutation-Token': mutationToken } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function auditLogsPath(filters: { action: string; actorRole: Role | 'all'; resourceType: string; from: string; to: string; pageSize: number }, page: number) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: filters.pageSize.toString()
  });

  if (filters.action.trim()) {
    params.set('action', filters.action.trim());
  }

  if (filters.actorRole !== 'all') {
    params.set('actorRole', filters.actorRole);
  }

  if (filters.resourceType.trim()) {
    params.set('resourceType', filters.resourceType.trim());
  }

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  return `/v1/admin/audit-logs?${params.toString()}`;
}

export function AdminConsole() {
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [mutationToken, setMutationToken] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPagination, setAuditPagination] = useState<AuditPagination>({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  const [auditFilters, setAuditFilters] = useState<{ action: string; actorRole: Role | 'all'; resourceType: string; from: string; to: string; pageSize: number }>({
    action: '',
    actorRole: 'all',
    resourceType: '',
    from: '',
    to: '',
    pageSize: 25
  });
  const [auditState, setAuditState] = useState<LoadState>('loading');
  const [state, setState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [updatingTenantId, setUpdatingTenantId] = useState<string | null>(null);
  const [updatingBranchId, setUpdatingBranchId] = useState<string | null>(null);
  const [tenantForm, setTenantForm] = useState({ name: '', slug: '', description: '', ownerUserId: '', ownerRole: 'owner' });
  const [branchForm, setBranchForm] = useState({ tenantId: '', name: '', slug: '', address: '' });
  const [membershipForm, setMembershipForm] = useState({ tenantId: '', userId: '', role: 'member' });
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const loadAdminData = async () => {
    setState((current) => (current === 'ready' ? current : 'loading'));
    setNotice(null);

    try {
      const [adminPayload, usersPayload, tenantsPayload, auditPayload] = await Promise.all([
        fetchJson<AdminMe>('/v1/admin/me'),
        fetchJson<{ data: AdminUser[] }>('/v1/admin/users'),
        fetchJson<{ data: AdminTenant[] }>('/v1/admin/tenants'),
        fetchJson<AuditLogsPayload>(auditLogsPath(auditFilters, 1))
      ]);

      setAdmin(adminPayload);
      setMutationToken(adminPayload.mutationToken);
      setUsers(usersPayload.data);
      setTenants(tenantsPayload.data);
      setSelectedTenantId((current) => current || tenantsPayload.data[0]?.id || '');
      setBranchForm((current) => ({ ...current, tenantId: current.tenantId || tenantsPayload.data[0]?.id || '' }));
      setMembershipForm((current) => ({ ...current, tenantId: current.tenantId || tenantsPayload.data[0]?.id || '' }));
      setAuditLogs(auditPayload.data);
      setAuditPagination(auditPayload.pagination);
      setAuditState('ready');
      setState('ready');
    } catch (error) {
      setState('error');
      setAuditState('error');
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูล admin ได้'
      });
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const searchable = [user.displayName, user.email, user.id, user.authAccounts.map((account) => account.provider).join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesRole && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [query, roleFilter, users]);

  const metrics = useMemo(() => {
    const adminCount = users.filter((user) => user.role === 'admin' || user.role === 'superadmin').length;
    const vendorCount = users.filter((user) => user.role === 'vendor').length;
    const driverCount = users.filter((user) => user.role === 'driver').length;
    const pendingBranchCount = tenants.reduce((count, tenant) => count + tenant.branches.filter((branch) => branch.status === 'pending').length, 0);

    return [
      { label: 'Users', value: users.length.toString(), detail: 'บัญชีในระบบ', icon: UsersRound },
      { label: 'Privileged', value: adminCount.toString(), detail: 'admin/superadmin', icon: ShieldCheck },
      { label: 'Tenants', value: tenants.length.toString(), detail: `${pendingBranchCount} pending branch`, icon: DatabaseZap },
      { label: 'Drivers', value: driverCount.toString(), detail: `${vendorCount} vendor roles`, icon: Activity }
    ];
  }, [tenants, users]);

  const selectedTenant = useMemo(() => tenants.find((tenant) => tenant.id === selectedTenantId) ?? tenants[0], [selectedTenantId, tenants]);

  const memberCandidates = useMemo(
    () => users.filter((user) => !selectedTenant?.memberships.some((membership) => membership.user.id === user.id)),
    [selectedTenant, users]
  );

  const refreshTenantsAndAudit = async () => {
    const [tenantsPayload, auditPayload] = await Promise.all([
      fetchJson<{ data: AdminTenant[] }>('/v1/admin/tenants'),
      fetchJson<AuditLogsPayload>(auditLogsPath(auditFilters, 1))
    ]);

    setTenants(tenantsPayload.data);
    setAuditLogs(auditPayload.data);
    setAuditPagination(auditPayload.pagination);
  };

  const loadAuditLogs = async (page = auditPagination.page, filters = auditFilters) => {
    setAuditState('loading');
    setNotice(null);

    try {
      const auditPayload = await fetchJson<AuditLogsPayload>(auditLogsPath(filters, page));
      setAuditLogs(auditPayload.data);
      setAuditPagination(auditPayload.pagination);
      setAuditState('ready');
    } catch (error) {
      setAuditState('error');
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'โหลด audit logs ไม่สำเร็จ'
      });
    }
  };

  const applyAuditFilters = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadAuditLogs(1, auditFilters);
  };

  const resetAuditFilters = async () => {
    const nextFilters = {
      action: '',
      actorRole: 'all' as const,
      resourceType: '',
      from: '',
      to: '',
      pageSize: 25
    };
    setAuditFilters(nextFilters);
    await loadAuditLogs(1, nextFilters);
  };

  const updateRole = async (user: AdminUser, nextRole: Role) => {
    if (user.role === nextRole) {
      return;
    }

    setUpdatingUserId(user.id);
    setNotice(null);

    try {
      await fetchJson<{ user: Pick<AdminUser, 'id' | 'email' | 'displayName' | 'role' | 'updatedAt'> }>(`/v1/admin/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole })
      }, mutationToken);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id ? { ...currentUser, role: nextRole, updatedAt: new Date().toISOString() } : currentUser
        )
      );
      setNotice({
        tone: 'success',
        message: `อัปเดต ${user.displayName ?? user.email ?? user.id} เป็น ${roleLabels[nextRole]} แล้ว`
      });
      const auditPayload = await fetchJson<AuditLogsPayload>(auditLogsPath(auditFilters, 1));
      setAuditLogs(auditPayload.data);
      setAuditPagination(auditPayload.pagination);
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'เปลี่ยน role ไม่สำเร็จ'
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const createTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    try {
      const payload = {
        ...tenantForm,
        slug: tenantForm.slug || slugify(tenantForm.name),
        ownerUserId: tenantForm.ownerUserId || undefined,
        description: tenantForm.description || undefined
      };
      const result = await fetchJson<{ tenant: AdminTenant }>('/v1/admin/tenants', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, mutationToken);

      setTenantForm({ name: '', slug: '', description: '', ownerUserId: '', ownerRole: 'owner' });
      setSelectedTenantId(result.tenant.id);
      setBranchForm((current) => ({ ...current, tenantId: result.tenant.id }));
      setMembershipForm((current) => ({ ...current, tenantId: result.tenant.id }));
      setNotice({ tone: 'success', message: `สร้าง tenant ${result.tenant.name} แล้ว และรออนุมัติ` });
      await refreshTenantsAndAudit();
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'สร้าง tenant ไม่สำเร็จ' });
    }
  };

  const updateTenantStatus = async (tenant: AdminTenant, status: TenantStatus) => {
    if (tenant.status === status) {
      return;
    }

    setUpdatingTenantId(tenant.id);
    setNotice(null);

    try {
      await fetchJson<{ tenant: Pick<AdminTenant, 'id' | 'name' | 'slug' | 'status' | 'updatedAt'> }>(`/v1/admin/tenants/${tenant.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }, mutationToken);
      setNotice({ tone: 'success', message: `อัปเดต ${tenant.name} เป็น ${status} แล้ว` });
      await refreshTenantsAndAudit();
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'อัปเดต tenant status ไม่สำเร็จ' });
    } finally {
      setUpdatingTenantId(null);
    }
  };

  const createMembership = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    try {
      await fetchJson<{ membership: AdminTenant['memberships'][number] }>(`/v1/admin/tenants/${membershipForm.tenantId}/memberships`, {
        method: 'POST',
        body: JSON.stringify({
          userId: membershipForm.userId,
          role: membershipForm.role
        })
      }, mutationToken);
      setMembershipForm((current) => ({ ...current, userId: '', role: 'member' }));
      setNotice({ tone: 'success', message: 'ผูก member เข้า tenant แล้ว' });
      await loadAdminData();
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'ผูก member ไม่สำเร็จ' });
    }
  };

  const createBranch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    try {
      await fetchJson<{ branch: AdminTenant['branches'][number] }>(`/v1/admin/tenants/${branchForm.tenantId}/branches`, {
        method: 'POST',
        body: JSON.stringify({
          ...branchForm,
          slug: branchForm.slug || slugify(branchForm.name),
          address: branchForm.address || undefined
        })
      }, mutationToken);
      setBranchForm((current) => ({ ...current, name: '', slug: '', address: '' }));
      setNotice({ tone: 'success', message: 'สร้าง branch แล้ว และรอ approval' });
      await refreshTenantsAndAudit();
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'สร้าง branch ไม่สำเร็จ' });
    }
  };

  const updateBranchStatus = async (branch: AdminTenant['branches'][number], status: BranchStatus) => {
    if (branch.status === status) {
      return;
    }

    setUpdatingBranchId(branch.id);
    setNotice(null);

    try {
      await fetchJson<{ branch: AdminTenant['branches'][number] }>(`/v1/admin/branches/${branch.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }, mutationToken);
      setNotice({ tone: 'success', message: `อัปเดต branch ${branch.name} เป็น ${status} แล้ว` });
      await refreshTenantsAndAudit();
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'อัปเดต branch status ไม่สำเร็จ' });
    } finally {
      setUpdatingBranchId(null);
    }
  };

  return (
    <>
      <section className="fox-admin-toolbar" aria-label="Admin operations toolbar">
        <div>
          <span>Operations Control</span>
          <strong>{admin ? `${admin.user.displayName} · ${roleLabels[admin.user.role]}` : 'Loading admin session'}</strong>
        </div>
        <button type="button" onClick={() => void loadAdminData()} disabled={state === 'loading'}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      </section>

      {notice ? (
        <section className={`fox-admin-notice fox-admin-notice--${notice.tone}`} aria-live="polite">
          {notice.tone === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <p>{notice.message}</p>
        </section>
      ) : null}

      <section className="fox-admin-metrics" aria-label="Admin metrics">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <article key={label}>
            <span>
              <Icon size={18} />
              {label}
            </span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <section className="fox-admin-workbench">
        <div className="fox-admin-panel fox-admin-panel--users">
          <div className="fox-admin-panel__head">
            <div>
              <h2>Users & Roles</h2>
              <p>จัดการสิทธิ์บัญชีจากข้อมูลจริงใน production DB</p>
            </div>
            <span>{filteredUsers.length} shown</span>
          </div>

          <div className="fox-admin-filters">
            <label>
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ email หรือ provider" />
            </label>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as Role | 'all')} aria-label="Filter by role">
              <option value="all">All roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>

          <div className="fox-admin-table" role="table" aria-label="Users and roles">
            <div className="fox-admin-table__header" role="row">
              <span role="columnheader">User</span>
              <span role="columnheader">Role</span>
              <span role="columnheader">Scope</span>
              <span role="columnheader">Updated</span>
            </div>

            {state === 'loading'
              ? Array.from({ length: 5 }, (_, index) => <div key={index} className="fox-admin-skeleton" />)
              : filteredUsers.map((user) => (
                  <article key={user.id} className="fox-admin-user-row" role="row">
                    <div role="cell">
                      <strong>{user.displayName ?? 'Unnamed user'}</strong>
                      <p>{user.email ?? 'No email from provider'}</p>
                      <small>{user.authAccounts.map((account) => account.provider).join(', ') || 'manual'}</small>
                    </div>
                    <div role="cell">
                      {admin?.permissions.canManageRoles ? (
                        <select
                          value={user.role}
                          onChange={(event) => void updateRole(user, event.target.value as Role)}
                          disabled={updatingUserId === user.id}
                          aria-label={`Change role for ${user.displayName ?? user.email ?? user.id}`}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={roleClassName(user.role)}>{roleLabels[user.role]}</span>
                      )}
                    </div>
                    <div role="cell">
                      <span className={roleClassName(user.role)}>{roleLabels[user.role]}</span>
                      <p>
                        {user.vendorMemberships.length
                          ? `${user.vendorMemberships.length} tenant`
                          : user.driverProfile
                            ? `driver ${user.driverProfile.status}`
                            : 'platform account'}
                      </p>
                    </div>
                    <div role="cell">
                      <time dateTime={user.updatedAt}>{formatDateTime(user.updatedAt)}</time>
                    </div>
                  </article>
                ))}
          </div>
        </div>

        <aside className="fox-admin-panel fox-admin-panel--audit" aria-label="Audit log">
          <div className="fox-admin-panel__head">
            <div>
              <h2>Audit Logs</h2>
              <p>ค้นหาเหตุการณ์จาก auth, role guard, mutation protection และ tenant/branch transitions</p>
            </div>
            <span>
              {auditPagination.total} events
            </span>
          </div>

          <form className="fox-audit-filters" onSubmit={(event) => void applyAuditFilters(event)}>
            <label>
              Action
              <input
                value={auditFilters.action}
                onChange={(event) => setAuditFilters((current) => ({ ...current, action: event.target.value }))}
                placeholder="admin.user_role"
              />
            </label>
            <label>
              Actor role
              <select value={auditFilters.actorRole} onChange={(event) => setAuditFilters((current) => ({ ...current, actorRole: event.target.value as Role | 'all' }))}>
                <option value="all">All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Resource
              <select value={auditFilters.resourceType} onChange={(event) => setAuditFilters((current) => ({ ...current, resourceType: event.target.value }))}>
                <option value="">All resources</option>
                {auditResourceTypes.map((resourceType) => (
                  <option key={resourceType} value={resourceType}>
                    {resourceType}
                  </option>
                ))}
              </select>
            </label>
            <label>
              From
              <input type="date" value={auditFilters.from} onChange={(event) => setAuditFilters((current) => ({ ...current, from: event.target.value }))} />
            </label>
            <label>
              To
              <input type="date" value={auditFilters.to} onChange={(event) => setAuditFilters((current) => ({ ...current, to: event.target.value }))} />
            </label>
            <label>
              Page size
              <select
                value={auditFilters.pageSize}
                onChange={(event) => setAuditFilters((current) => ({ ...current, pageSize: Number(event.target.value) }))}
              >
                {auditPageSizeOptions.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <button type="submit" disabled={auditState === 'loading'}>
                <Search size={15} />
                Apply
              </button>
              <button type="button" onClick={() => void resetAuditFilters()} disabled={auditState === 'loading'}>
                <RefreshCcw size={15} />
                Reset
              </button>
            </div>
          </form>

          <div className="fox-audit-list">
            {auditState === 'loading'
              ? Array.from({ length: 6 }, (_, index) => <div key={index} className="fox-admin-skeleton fox-admin-skeleton--compact" />)
              : auditLogs.length
                ? auditLogs.map((log) => (
                  <article key={log.id} className="fox-audit-item">
                    <div>
                      <strong>{log.action}</strong>
                      <span>{log.actorUser?.displayName ?? log.actorUser?.email ?? log.actorRole ?? 'anonymous'}</span>
                    </div>
                    <p>
                      {log.method ?? 'SYS'} {log.route ?? log.resourceType ?? 'system'}
                    </p>
                    <time dateTime={log.createdAt}>{formatDateTime(log.createdAt)}</time>
                  </article>
                ))
                : (
                  <div className="fox-empty-state fox-empty-state--compact">
                    <History size={20} />
                    <strong>No audit events found</strong>
                    <p>ปรับ filter หรือ reset เพื่อกลับไปดูเหตุการณ์ล่าสุด</p>
                  </div>
                )}
          </div>

          <div className="fox-audit-pagination" aria-label="Audit log pagination">
            <button
              type="button"
              onClick={() => void loadAuditLogs(Math.max(auditPagination.page - 1, 1))}
              disabled={auditState === 'loading' || auditPagination.page <= 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span>
              Page {auditPagination.page} / {auditPagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => void loadAuditLogs(Math.min(auditPagination.page + 1, auditPagination.totalPages))}
              disabled={auditState === 'loading' || auditPagination.page >= auditPagination.totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </aside>
      </section>

      <section className="fox-admin-tenant-board" aria-label="Tenant and branch approval flow">
        <div className="fox-admin-panel fox-admin-panel--tenant-create">
          <div className="fox-admin-panel__head">
            <div>
              <h2>Tenant & Branch Approval</h2>
              <p>สร้าง tenant, ผูก owner/member, สร้าง branch แบบ pending และอนุมัติ operating status พร้อม audit</p>
            </div>
            <Building2 size={19} />
          </div>

          <form className="fox-admin-form" onSubmit={(event) => void createTenant(event)}>
            <label>
              Tenant name
              <input
                value={tenantForm.name}
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: current.slug || slugify(event.target.value)
                  }))
                }
                placeholder="เช่น SROS Fresh Supply"
                required
              />
            </label>
            <label>
              Slug
              <input
                value={tenantForm.slug}
                onChange={(event) => setTenantForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                placeholder="sros-fresh-supply"
                required
              />
            </label>
            <label>
              Owner
              <select value={tenantForm.ownerUserId} onChange={(event) => setTenantForm((current) => ({ ...current, ownerUserId: event.target.value }))}>
                <option value="">เลือกภายหลัง</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName ?? user.email ?? user.id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Owner role
              <select value={tenantForm.ownerRole} onChange={(event) => setTenantForm((current) => ({ ...current, ownerRole: event.target.value }))}>
                {membershipRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label className="fox-admin-form__wide">
              Description
              <input
                value={tenantForm.description}
                onChange={(event) => setTenantForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="ขอบเขตธุรกิจ พื้นที่ให้บริการ หรือ operational note"
              />
            </label>
            <button type="submit">
              <Plus size={16} />
              Create tenant
            </button>
          </form>
        </div>

        <div className="fox-admin-panel fox-admin-panel--tenant-list">
          <div className="fox-admin-panel__head">
            <div>
              <h2>Tenants</h2>
              <p>เลือก tenant เพื่อจัดการ member, branch และ operating status</p>
            </div>
            <span>{tenants.length} tenants</span>
          </div>

          <div className="fox-tenant-list">
            {state === 'loading'
              ? Array.from({ length: 3 }, (_, index) => <div key={index} className="fox-admin-skeleton fox-admin-skeleton--compact" />)
              : tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    type="button"
                    className={`fox-tenant-item ${selectedTenant?.id === tenant.id ? 'fox-tenant-item--active' : ''}`}
                    onClick={() => {
                      setSelectedTenantId(tenant.id);
                      setBranchForm((current) => ({ ...current, tenantId: tenant.id }));
                      setMembershipForm((current) => ({ ...current, tenantId: tenant.id }));
                    }}
                  >
                    <span>
                      <strong>{tenant.name}</strong>
                      <small>{tenant.slug}</small>
                    </span>
                    <span className={statusClassName(tenant.status)}>{tenant.status}</span>
                  </button>
                ))}
          </div>
        </div>

        <div className="fox-admin-panel fox-admin-panel--tenant-detail">
          {selectedTenant ? (
            <>
              <div className="fox-admin-panel__head">
                <div>
                  <h2>{selectedTenant.name}</h2>
                  <p>{selectedTenant.description ?? 'No tenant description yet'}</p>
                </div>
                <span className={statusClassName(selectedTenant.status)}>{selectedTenant.status}</span>
              </div>

              <div className="fox-tenant-status-actions" aria-label="Tenant status controls">
                {tenantStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={updatingTenantId === selectedTenant.id || selectedTenant.status === status}
                    onClick={() => void updateTenantStatus(selectedTenant, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="fox-tenant-detail-grid">
                <section>
                  <div className="fox-console-section-head">
                    <h3>Owner / Members</h3>
                    <span>{selectedTenant.memberships.length}</span>
                  </div>
                  <div className="fox-member-list">
                    {selectedTenant.memberships.map((membership) => (
                      <article key={membership.id}>
                        <UserPlus size={16} />
                        <div>
                          <strong>{membership.user.displayName ?? membership.user.email ?? membership.user.id}</strong>
                          <p>
                            {membership.role} · {membership.user.role}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>

                  <form className="fox-admin-form fox-admin-form--inline" onSubmit={(event) => void createMembership(event)}>
                    <label>
                      Add member
                      <select
                        value={membershipForm.userId}
                        onChange={(event) => setMembershipForm((current) => ({ ...current, userId: event.target.value, tenantId: selectedTenant.id }))}
                        required
                      >
                        <option value="">เลือก user</option>
                        {memberCandidates.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.displayName ?? user.email ?? user.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Role
                      <select value={membershipForm.role} onChange={(event) => setMembershipForm((current) => ({ ...current, role: event.target.value }))}>
                        {membershipRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={!membershipForm.userId}>
                      <UserPlus size={16} />
                      Add
                    </button>
                  </form>
                </section>

                <section>
                  <div className="fox-console-section-head">
                    <h3>Branches</h3>
                    <span>{selectedTenant.branches.length}</span>
                  </div>
                  <div className="fox-branch-list">
                    {selectedTenant.branches.map((branch) => (
                      <article key={branch.id}>
                        <span>
                          <Store size={16} />
                        </span>
                        <div>
                          <strong>{branch.name}</strong>
                          <p>
                            {branch.slug}
                            {branch.address ? ` · ${branch.address}` : ''}
                          </p>
                        </div>
                        <select
                          value={branch.status}
                          disabled={updatingBranchId === branch.id}
                          onChange={(event) => void updateBranchStatus(branch, event.target.value as BranchStatus)}
                          aria-label={`Update branch status for ${branch.name}`}
                        >
                          {branchStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </article>
                    ))}
                  </div>

                  <form className="fox-admin-form fox-admin-form--branch" onSubmit={(event) => void createBranch(event)}>
                    <label>
                      Branch name
                      <input
                        value={branchForm.name}
                        onChange={(event) =>
                          setBranchForm((current) => ({
                            ...current,
                            tenantId: selectedTenant.id,
                            name: event.target.value,
                            slug: current.slug || slugify(event.target.value)
                          }))
                        }
                        placeholder="เช่น นิมมาน"
                        required
                      />
                    </label>
                    <label>
                      Slug
                      <input
                        value={branchForm.slug}
                        onChange={(event) => setBranchForm((current) => ({ ...current, tenantId: selectedTenant.id, slug: slugify(event.target.value) }))}
                        placeholder="nimman"
                        required
                      />
                    </label>
                    <label className="fox-admin-form__wide">
                      Address
                      <input
                        value={branchForm.address}
                        onChange={(event) => setBranchForm((current) => ({ ...current, tenantId: selectedTenant.id, address: event.target.value }))}
                        placeholder="ที่อยู่หรือ operating area"
                      />
                    </label>
                    <button type="submit">
                      <Plus size={16} />
                      Create branch
                    </button>
                  </form>
                </section>
              </div>
            </>
          ) : (
            <div className="fox-empty-state">
              <Building2 size={22} />
              <strong>ยังไม่มี tenant</strong>
              <p>สร้าง tenant แรกเพื่อเริ่ม approval flow และ branch operating status</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
