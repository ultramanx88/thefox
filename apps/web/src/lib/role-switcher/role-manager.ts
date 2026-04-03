interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  dashboardUrl: string;
  icon: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  availableRoles: string[];
  currentRole: string;
}

export class RoleSwitcherManager {
  private roles: Record<string, UserRole> = {
    customer: {
      id: 'customer',
      name: 'ลูกค้า',
      permissions: ['order', 'view_products', 'manage_profile'],
      dashboardUrl: '/dashboard/customer',
      icon: '👤'
    },
    driver: {
      id: 'driver',
      name: 'คนส่งของ',
      permissions: ['view_jobs', 'update_delivery', 'manage_schedule'],
      dashboardUrl: '/driver-app',
      icon: '🏍️'
    },
    business: {
      id: 'business',
      name: 'ลูกค้าธุรกิจ',
      permissions: ['bulk_order', 'manage_team', 'view_analytics'],
      dashboardUrl: '/bulk-orders',
      icon: '🏢'
    },
    admin: {
      id: 'admin',
      name: 'ผู้ดูแลระบบ',
      permissions: ['manage_users', 'system_settings', 'view_reports'],
      dashboardUrl: '/admin',
      icon: '⚙️'
    },
    store_owner: {
      id: 'store_owner',
      name: 'เจ้าของร้าน',
      permissions: ['manage_menu', 'view_orders', 'manage_store'],
      dashboardUrl: '/store-dashboard',
      icon: '🏪'
    }
  };

  private currentUser: User = {
    id: 'user_001',
    email: 'user@example.com',
    name: 'ผู้ใช้ทดสอบ',
    availableRoles: ['customer', 'driver', 'business'],
    currentRole: 'customer'
  };

  switchRole(roleId: string): boolean {
    if (!this.currentUser.availableRoles.includes(roleId)) {
      return false;
    }

    this.currentUser.currentRole = roleId;
    this.saveToStorage();
    return true;
  }

  getCurrentRole(): UserRole {
    return this.roles[this.currentUser.currentRole];
  }

  getAvailableRoles(): UserRole[] {
    return this.currentUser.availableRoles.map(roleId => this.roles[roleId]);
  }

  hasPermission(permission: string): boolean {
    const currentRole = this.getCurrentRole();
    return currentRole.permissions.includes(permission);
  }

  addRoleToUser(roleId: string): boolean {
    if (this.roles[roleId] && !this.currentUser.availableRoles.includes(roleId)) {
      this.currentUser.availableRoles.push(roleId);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  removeRoleFromUser(roleId: string): boolean {
    if (this.currentUser.availableRoles.length <= 1) {
      return false; // Must have at least one role
    }

    const index = this.currentUser.availableRoles.indexOf(roleId);
    if (index > -1) {
      this.currentUser.availableRoles.splice(index, 1);
      
      if (this.currentUser.currentRole === roleId) {
        this.currentUser.currentRole = this.currentUser.availableRoles[0];
      }
      
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getCurrentUser(): User {
    return { ...this.currentUser };
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
  }

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    }
  }

  getRoleDashboardUrl(): string {
    return this.getCurrentRole().dashboardUrl;
  }

  canAccessUrl(url: string): boolean {
    const currentRole = this.getCurrentRole();
    
    // Define URL access rules
    const urlRules: Record<string, string[]> = {
      '/admin': ['admin'],
      '/driver-app': ['driver', 'admin'],
      '/bulk-orders': ['business', 'admin'],
      '/store-dashboard': ['store_owner', 'admin'],
      '/delivery-scheduling': ['admin']
    };

    for (const [pattern, allowedRoles] of Object.entries(urlRules)) {
      if (url.startsWith(pattern)) {
        return allowedRoles.includes(currentRole.id);
      }
    }

    return true; // Allow access to public URLs
  }
}

export const roleSwitcherManager = new RoleSwitcherManager();