import { auth } from 'firebase-admin';
import { UserRole, UserStatus } from './auth';

// ===========================================
// CUSTOM CLAIMS INTERFACES
// ===========================================

export interface CustomClaims {
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  verified: {
    email: boolean;
    phone: boolean;
    documents: boolean;
  };
  metadata?: {
    approvedAt?: number;
    approvedBy?: string;
    lastUpdated: number;
  };
}

export interface RolePermissions {
  [key: string]: string[];
}

// ===========================================
// ROLE PERMISSIONS CONFIGURATION
// ===========================================

export const ROLE_PERMISSIONS: RolePermissions = {
  customer: [
    'orders:create',
    'orders:read:own',
    'orders:update:own',
    'profile:read:own',
    'profile:update:own',
    'reviews:create',
    'reviews:read',
    'notifications:read:own',
    'notifications:update:own',
  ],
  driver: [
    'orders:read:assigned',
    'orders:update:assigned',
    'deliveries:create',
    'deliveries:read:own',
    'deliveries:update:own',
    'profile:read:own',
    'profile:update:own',
    'notifications:read:own',
    'notifications:update:own',
    'location:update:own',
  ],
  vendor: [
    'products:create:own',
    'products:read:own',
    'products:update:own',
    'products:delete:own',
    'orders:read:own',
    'orders:update:own',
    'markets:create:own',
    'markets:read:own',
    'markets:update:own',
    'profile:read:own',
    'profile:update:own',
    'notifications:read:own',
    'notifications:update:own',
    'analytics:read:own',
  ],
  admin: [
    'users:read',
    'users:update',
    'users:delete',
    'applications:read',
    'applications:update',
    'orders:read',
    'orders:update',
    'products:read',
    'products:update',
    'products:delete',
    'markets:read',
    'markets:update',
    'markets:delete',
    'categories:create',
    'categories:update',
    'categories:delete',
    'analytics:read',
    'system:manage',
    'notifications:create',
    'notifications:read',
    'reports:generate',
  ],
};

// ===========================================
// USER CLAIMS SERVICE CLASS
// ===========================================

export class UserClaimsService {
  
  /**
   * Set custom claims for a user
   */
  static async setUserClaims(
    uid: string,
    role: UserRole,
    status: UserStatus,
    verified: CustomClaims['verified'],
    approvedBy?: string
  ): Promise<void> {
    try {
      const permissions = ROLE_PERMISSIONS[role] || [];
      
      const customClaims: CustomClaims = {
        role,
        status,
        permissions,
        verified,
        metadata: {
          lastUpdated: Date.now(),
          ...(approvedBy && { approvedBy, approvedAt: Date.now() }),
        },
      };

      await auth().setCustomUserClaims(uid, customClaims);
      console.log(`Custom claims set for user ${uid}:`, customClaims);
    } catch (error) {
      console.error('Error setting custom claims:', error);
      throw error;
    }
  }

  /**
   * Update user role and permissions
   */
  static async updateUserRole(
    uid: string,
    newRole: UserRole,
    updatedBy: string
  ): Promise<void> {
    try {
      // Get current claims
      const userRecord = await auth().getUser(uid);
      const currentClaims = (userRecord.customClaims as CustomClaims) || {};

      // Update role and permissions
      const updatedClaims: CustomClaims = {
        ...currentClaims,
        role: newRole,
        permissions: ROLE_PERMISSIONS[newRole] || [],
        metadata: {
          ...currentClaims.metadata,
          lastUpdated: Date.now(),
          updatedBy,
        },
      };

      await auth().setCustomUserClaims(uid, updatedClaims);
      console.log(`Role updated for user ${uid} to ${newRole} by ${updatedBy}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  static async updateUserStatus(
    uid: string,
    newStatus: UserStatus,
    updatedBy: string
  ): Promise<void> {
    try {
      // Get current claims
      const userRecord = await auth().getUser(uid);
      const currentClaims = (userRecord.customClaims as CustomClaims) || {};

      // Update status
      const updatedClaims: CustomClaims = {
        ...currentClaims,
        status: newStatus,
        metadata: {
          ...currentClaims.metadata,
          lastUpdated: Date.now(),
          ...(newStatus === 'active' && { approvedBy: updatedBy, approvedAt: Date.now() }),
        },
      };

      await auth().setCustomUserClaims(uid, updatedClaims);
      console.log(`Status updated for user ${uid} to ${newStatus} by ${updatedBy}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Update verification status in claims
   */
  static async updateVerificationClaims(
    uid: string,
    verificationType: keyof CustomClaims['verified'],
    verified: boolean
  ): Promise<void> {
    try {
      // Get current claims
      const userRecord = await auth().getUser(uid);
      const currentClaims = (userRecord.customClaims as CustomClaims) || {};

      // Update verification status
      const updatedClaims: CustomClaims = {
        ...currentClaims,
        verified: {
          ...currentClaims.verified,
          [verificationType]: verified,
        },
        metadata: {
          ...currentClaims.metadata,
          lastUpdated: Date.now(),
        },
      };

      await auth().setCustomUserClaims(uid, updatedClaims);
      console.log(`Verification updated for user ${uid}: ${verificationType} = ${verified}`);
    } catch (error) {
      console.error('Error updating verification claims:', error);
      throw error;
    }
  }

  /**
   * Get user claims
   */
  static async getUserClaims(uid: string): Promise<CustomClaims | null> {
    try {
      const userRecord = await auth().getUser(uid);
      return (userRecord.customClaims as CustomClaims) || null;
    } catch (error) {
      console.error('Error getting user claims:', error);
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(uid: string, permission: string): Promise<boolean> {
    try {
      const claims = await this.getUserClaims(uid);
      return claims?.permissions.includes(permission) || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if user has role
   */
  static async hasRole(uid: string, role: UserRole): Promise<boolean> {
    try {
      const claims = await this.getUserClaims(uid);
      return claims?.role === role || false;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  /**
   * Check if user is active
   */
  static async isUserActive(uid: string): Promise<boolean> {
    try {
      const claims = await this.getUserClaims(uid);
      return claims?.status === 'active' || false;
    } catch (error) {
      console.error('Error checking user status:', error);
      return false;
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: UserRole, maxResults: number = 1000): Promise<string[]> {
    try {
      const listUsersResult = await auth().listUsers(maxResults);
      const userIds: string[] = [];

      for (const userRecord of listUsersResult.users) {
        const claims = userRecord.customClaims as CustomClaims;
        if (claims?.role === role) {
          userIds.push(userRecord.uid);
        }
      }

      return userIds;
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  /**
   * Get users by status
   */
  static async getUsersByStatus(status: UserStatus, maxResults: number = 1000): Promise<string[]> {
    try {
      const listUsersResult = await auth().listUsers(maxResults);
      const userIds: string[] = [];

      for (const userRecord of listUsersResult.users) {
        const claims = userRecord.customClaims as CustomClaims;
        if (claims?.status === status) {
          userIds.push(userRecord.uid);
        }
      }

      return userIds;
    } catch (error) {
      console.error('Error getting users by status:', error);
      return [];
    }
  }

  /**
   * Revoke all user sessions (force re-authentication)
   */
  static async revokeUserSessions(uid: string): Promise<void> {
    try {
      await auth().revokeRefreshTokens(uid);
      console.log(`All sessions revoked for user ${uid}`);
    } catch (error) {
      console.error('Error revoking user sessions:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(uid: string): Promise<void> {
    try {
      await auth().deleteUser(uid);
      console.log(`User ${uid} deleted successfully`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Disable user account
   */
  static async disableUser(uid: string): Promise<void> {
    try {
      await auth().updateUser(uid, { disabled: true });
      await this.updateUserStatus(uid, 'suspended', 'system');
      console.log(`User ${uid} disabled successfully`);
    } catch (error) {
      console.error('Error disabling user:', error);
      throw error;
    }
  }

  /**
   * Enable user account
   */
  static async enableUser(uid: string): Promise<void> {
    try {
      await auth().updateUser(uid, { disabled: false });
      await this.updateUserStatus(uid, 'active', 'system');
      console.log(`User ${uid} enabled successfully`);
    } catch (error) {
      console.error('Error enabling user:', error);
      throw error;
    }
  }

  /**
   * Bulk update user claims
   */
  static async bulkUpdateClaims(
    updates: Array<{
      uid: string;
      role?: UserRole;
      status?: UserStatus;
      verified?: Partial<CustomClaims['verified']>;
    }>,
    updatedBy: string
  ): Promise<{ success: string[]; failed: Array<{ uid: string; error: string }> }> {
    const success: string[] = [];
    const failed: Array<{ uid: string; error: string }> = [];

    for (const update of updates) {
      try {
        const userRecord = await auth().getUser(update.uid);
        const currentClaims = (userRecord.customClaims as CustomClaims) || {};

        const updatedClaims: CustomClaims = {
          ...currentClaims,
          ...(update.role && { 
            role: update.role, 
            permissions: ROLE_PERMISSIONS[update.role] || [] 
          }),
          ...(update.status && { status: update.status }),
          ...(update.verified && { 
            verified: { ...currentClaims.verified, ...update.verified } 
          }),
          metadata: {
            ...currentClaims.metadata,
            lastUpdated: Date.now(),
            updatedBy,
          },
        };

        await auth().setCustomUserClaims(update.uid, updatedClaims);
        success.push(update.uid);
      } catch (error: any) {
        failed.push({ uid: update.uid, error: error.message });
      }
    }

    return { success, failed };
  }
}

// Export for convenience
export { UserClaimsService as default };