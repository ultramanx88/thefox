/**
 * Authentication Cloud Functions
 * Handles user lifecycle events and role management
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

const auth = getAuth();
const db = getFirestore();

// ===========================================
// USER LIFECYCLE FUNCTIONS
// ===========================================

/**
 * Triggered when a new user document is created in Firestore
 * Sets up user profile and custom claims
 */
export const onUserCreate = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    if (!userData) {
      logger.error("No user data found", { userId });
      return;
    }

    try {
      // Set custom claims based on user role
      await auth.setCustomUserClaims(userId, {
        role: userData.role,
        verified: false,
        createdAt: new Date().toISOString(),
      });

      // Create user profile in additional collections if needed
      const userProfile = {
        userId,
        role: userData.role,
        status: 'active',
        createdAt: new Date(),
        lastLoginAt: null,
        preferences: {
          language: 'th',
          currency: 'THB',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
      };

      await db.collection('userProfiles').doc(userId).set(userProfile);

      // Send welcome notification
      await db.collection('notifications').add({
        userId,
        title: 'ยินดีต้อนรับสู่ theFOX!',
        message: 'บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว',
        type: 'system',
        isRead: false,
        createdAt: new Date(),
      });

      logger.info("User profile created successfully", { 
        userId, 
        role: userData.role 
      });

    } catch (error) {
      logger.error("Error creating user profile", { 
        userId, 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

/**
 * Triggered when a user document is deleted from Firestore
 * Cleans up user-related data
 */
export const onUserDelete = onDocumentDeleted(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;

    try {
      // Delete user from Firebase Auth
      await auth.deleteUser(userId);

      // Clean up related collections
      const batch = db.batch();

      // Delete user profile
      const userProfileRef = db.collection('userProfiles').doc(userId);
      batch.delete(userProfileRef);

      // Delete user notifications
      const notificationsQuery = await db
        .collection('notifications')
        .where('userId', '==', userId)
        .get();

      notificationsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete user orders (mark as deleted, don't actually delete for audit)
      const ordersQuery = await db
        .collection('orders')
        .where('userId', '==', userId)
        .get();

      ordersQuery.docs.forEach(doc => {
        batch.update(doc.ref, { 
          status: 'deleted',
          deletedAt: new Date(),
        });
      });

      await batch.commit();

      logger.info("User data cleaned up successfully", { userId });

    } catch (error) {
      logger.error("Error cleaning up user data", { 
        userId, 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

// ===========================================
// ROLE MANAGEMENT FUNCTIONS
// ===========================================

/**
 * Callable function to set custom claims for a user
 * Only admins can call this function
 */
export const setCustomClaims = onCall(
  { cors: true },
  async (request) => {
    // Verify caller is admin
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const callerClaims = request.auth.token;
    if (callerClaims.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can set custom claims');
    }

    const { userId, claims } = request.data;

    if (!userId || !claims) {
      throw new HttpsError('invalid-argument', 'userId and claims are required');
    }

    try {
      // Validate claims
      const allowedClaims = ['role', 'verified', 'permissions'];
      const validClaims = Object.keys(claims).every(key => allowedClaims.includes(key));

      if (!validClaims) {
        throw new HttpsError('invalid-argument', 'Invalid claims provided');
      }

      // Set custom claims
      await auth.setCustomUserClaims(userId, claims);

      // Update user document
      await db.collection('users').doc(userId).update({
        ...claims,
        updatedAt: new Date(),
      });

      logger.info("Custom claims set successfully", { 
        userId, 
        claims,
        setBy: request.auth.uid 
      });

      return { success: true, message: 'Custom claims set successfully' };

    } catch (error) {
      logger.error("Error setting custom claims", { 
        userId, 
        claims,
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to set custom claims');
    }
  }
);

/**
 * Callable function to verify user role
 * Returns user role and verification status
 */
export const verifyUserRole = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;

    try {
      // Get user record from Firebase Auth
      const userRecord = await auth.getUser(userId);
      const customClaims = userRecord.customClaims || {};

      // Get user document from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError('not-found', 'User document not found');
      }

      const roleInfo = {
        userId,
        role: customClaims.role || userData.role,
        verified: customClaims.verified || false,
        permissions: customClaims.permissions || [],
        status: userData.status || 'active',
        lastVerified: customClaims.lastVerified || null,
      };

      logger.info("User role verified", { userId, role: roleInfo.role });

      return roleInfo;

    } catch (error) {
      logger.error("Error verifying user role", { 
        userId,
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to verify user role');
    }
  }
);

// ===========================================
// USER VERIFICATION FUNCTIONS
// ===========================================

/**
 * Callable function to verify user account
 * Used for driver and vendor verification process
 */
export const verifyUserAccount = onCall(
  { cors: true },
  async (request) => {
    // Verify caller is admin
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const callerClaims = request.auth.token;
    if (callerClaims.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can verify accounts');
    }

    const { userId, verified, reason } = request.data;

    if (!userId || typeof verified !== 'boolean') {
      throw new HttpsError('invalid-argument', 'userId and verified status are required');
    }

    try {
      // Update custom claims
      const userRecord = await auth.getUser(userId);
      const currentClaims = userRecord.customClaims || {};

      await auth.setCustomUserClaims(userId, {
        ...currentClaims,
        verified,
        verifiedAt: verified ? new Date().toISOString() : null,
        verifiedBy: request.auth.uid,
      });

      // Update user document
      await db.collection('users').doc(userId).update({
        verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: request.auth.uid,
        verificationReason: reason || null,
        updatedAt: new Date(),
      });

      // Send notification to user
      await db.collection('notifications').add({
        userId,
        title: verified ? 'บัญชีได้รับการยืนยันแล้ว' : 'บัญชีถูกระงับการยืนยัน',
        message: verified 
          ? 'บัญชีของคุณได้รับการยืนยันเรียบร้อยแล้ว คุณสามารถใช้งานได้เต็มรูปแบบ'
          : `บัญชีของคุณถูกระงับการยืนยัน เหตุผล: ${reason || 'ไม่ระบุ'}`,
        type: 'system',
        isRead: false,
        createdAt: new Date(),
      });

      logger.info("User account verification updated", { 
        userId, 
        verified,
        verifiedBy: request.auth.uid,
        reason 
      });

      return { 
        success: true, 
        message: `User account ${verified ? 'verified' : 'unverified'} successfully` 
      };

    } catch (error) {
      logger.error("Error updating user verification", { 
        userId, 
        verified,
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to update user verification');
    }
  }
);

/**
 * Callable function to get user statistics
 * Admin only function for dashboard
 */
export const getUserStats = onCall(
  { cors: true },
  async (request) => {
    // Verify caller is admin
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const callerClaims = request.auth.token;
    if (callerClaims.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can access user stats');
    }

    try {
      const usersCollection = db.collection('users');

      // Get user counts by role
      const [customers, vendors, drivers, admins] = await Promise.all([
        usersCollection.where('role', '==', 'customer').count().get(),
        usersCollection.where('role', '==', 'vendor').count().get(),
        usersCollection.where('role', '==', 'driver').count().get(),
        usersCollection.where('role', '==', 'admin').count().get(),
      ]);

      // Get verification stats
      const [verified, unverified] = await Promise.all([
        usersCollection.where('verified', '==', true).count().get(),
        usersCollection.where('verified', '==', false).count().get(),
      ]);

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRegistrations = await usersCollection
        .where('createdAt', '>=', thirtyDaysAgo)
        .count()
        .get();

      const stats = {
        totalUsers: customers.data().count + vendors.data().count + drivers.data().count + admins.data().count,
        usersByRole: {
          customers: customers.data().count,
          vendors: vendors.data().count,
          drivers: drivers.data().count,
          admins: admins.data().count,
        },
        verificationStats: {
          verified: verified.data().count,
          unverified: unverified.data().count,
        },
        recentRegistrations: recentRegistrations.data().count,
        generatedAt: new Date().toISOString(),
      };

      logger.info("User stats generated", { 
        requestedBy: request.auth.uid,
        totalUsers: stats.totalUsers 
      });

      return stats;

    } catch (error) {
      logger.error("Error generating user stats", { 
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to generate user stats');
    }
  }
);