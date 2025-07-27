import { onCall } from "firebase-functions/v2/https";
import { beforeUserCreated, beforeUserSignedIn } from "firebase-functions/v2/identity";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const auth = getAuth();
const db = getFirestore();

// ===========================================
// USER LIFECYCLE FUNCTIONS
// ===========================================

/**
 * Triggered when a new user is created
 * Sets up user profile and default settings
 */
export const onUserCreate = beforeUserCreated(async (event) => {
  const user = event.data;
  
  if (!user) {
    logger.error("No user data provided");
    return;
  }
  
  try {
    logger.info("Creating user profile", { uid: user.uid, email: user.email });
    
    // Create user document in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || '',
      phone: user.phoneNumber || '',
      role: 'customer', // Default role
      isActive: true,
      emailVerified: user.emailVerified || false,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    
    await db.collection('users').doc(user.uid).set(userDoc);
    
    // Set default custom claims
    await auth.setCustomUserClaims(user.uid, {
      role: 'customer',
      isActive: true,
    });
    
    logger.info("User profile created successfully", { uid: user.uid });
    
  } catch (error) {
    logger.error("Error creating user profile", { 
      uid: user.uid, 
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Triggered before user signs in
 * Validates user status and updates last login
 */
export const onUserSignIn = beforeUserSignedIn(async (event) => {
  const user = event.data;
  
  if (!user) {
    logger.error("No user data provided");
    return;
  }
  
  try {
    // Get user document
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      logger.warn("User document not found during sign in", { uid: user.uid });
      return;
    }
    
    const userData = userDoc.data();
    
    // Check if user is active
    if (!userData?.isActive) {
      logger.warn("Inactive user attempted to sign in", { uid: user.uid });
      throw new Error("Account is deactivated. Please contact support.");
    }
    
    // Update last login time
    await db.collection('users').doc(user.uid).update({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    });
    
    logger.info("User signed in successfully", { uid: user.uid });
    
  } catch (error) {
    logger.error("Error during user sign in", { 
      uid: user.uid, 
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Triggered when user document is deleted
 * Cleans up user data and revokes authentication
 */
export const onUserDelete = onDocumentDeleted("users/{userId}", async (event) => {
  const userId = event.params.userId;
  
  try {
    logger.info("Cleaning up deleted user", { userId });
    
    // Delete user from Authentication
    try {
      await auth.deleteUser(userId);
      logger.info("User deleted from Authentication", { userId });
    } catch (authError) {
      logger.warn("User not found in Authentication", { userId, error: authError });
    }
    
    // Clean up related data
    const batch = db.batch();
    
    // Delete user's orders
    const ordersSnapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .get();
    
    ordersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's notifications
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .get();
    
    notificationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's reviews
    const reviewsSnapshot = await db.collection('reviews')
      .where('userId', '==', userId)
      .get();
    
    reviewsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    logger.info("User cleanup completed", { userId });
    
  } catch (error) {
    logger.error("Error cleaning up user", { 
      userId, 
      error: error instanceof Error ? error.message : error 
    });
  }
});

// ===========================================
// ROLE MANAGEMENT FUNCTIONS
// ===========================================

/**
 * Set custom claims for a user (Admin only)
 */
export const setCustomClaims = onCall<{
  userId: string;
  claims: { [key: string]: any };
}>({ 
  cors: true,
  enforceAppCheck: true 
}, async (request) => {
  const { userId, claims } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify caller is admin
    if (!callerUid) {
      throw new Error("Authentication required");
    }
    
    const callerDoc = await db.collection('users').doc(callerUid).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== 'admin') {
      throw new Error("Admin access required");
    }
    
    // Validate claims
    const allowedClaims = ['role', 'isActive', 'permissions'];
    const validClaims = Object.keys(claims).every(key => allowedClaims.includes(key));
    
    if (!validClaims) {
      throw new Error("Invalid claims provided");
    }
    
    // Set custom claims
    await auth.setCustomUserClaims(userId, claims);
    
    // Update user document
    await db.collection('users').doc(userId).update({
      ...claims,
      updatedAt: new Date(),
      updatedBy: callerUid,
    });
    
    logger.info("Custom claims set successfully", { 
      userId, 
      claims, 
      setBy: callerUid 
    });
    
    return { success: true, message: "Claims updated successfully" };
    
  } catch (error) {
    logger.error("Error setting custom claims", { 
      userId, 
      claims, 
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Verify user role and permissions
 */
export const verifyUserRole = onCall<{
  userId: string;
  requiredRole: string;
}>({ 
  cors: true 
}, async (request) => {
  const { userId, requiredRole } = request.data;
  
  try {
    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return { 
        valid: false, 
        message: "User not found" 
      };
    }
    
    const userData = userDoc.data();
    const userRole = userData?.role;
    
    // Check role hierarchy
    const roleHierarchy = {
      'customer': 1,
      'driver': 2,
      'vendor': 3,
      'admin': 4,
    };
    
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    const hasPermission = userLevel >= requiredLevel;
    
    return {
      valid: hasPermission,
      userRole,
      requiredRole,
      message: hasPermission ? "Access granted" : "Insufficient permissions"
    };
    
  } catch (error) {
    logger.error("Error verifying user role", { 
      userId, 
      requiredRole,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

// ===========================================
// USER PROFILE FUNCTIONS
// ===========================================

/**
 * Update user profile (Authenticated users only)
 */
export const updateUserProfile = onCall<{
  name?: string;
  phone?: string;
  preferences?: any;
}>({ 
  cors: true 
}, async (request) => {
  const updates = request.data;
  const userId = request.auth?.uid;
  
  try {
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Validate updates
    const allowedFields = ['name', 'phone', 'preferences'];
    const validUpdates = Object.keys(updates).every(key => allowedFields.includes(key));
    
    if (!validUpdates) {
      throw new Error("Invalid fields in update");
    }
    
    // Update user document
    await db.collection('users').doc(userId).update({
      ...updates,
      updatedAt: new Date(),
    });
    
    // Update Authentication profile if name changed
    if (updates.name) {
      await auth.updateUser(userId, {
        displayName: updates.name,
      });
    }
    
    logger.info("User profile updated", { userId, updates });
    
    return { success: true, message: "Profile updated successfully" };
    
  } catch (error) {
    logger.error("Error updating user profile", { 
      userId,
      updates,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Deactivate user account
 */
export const deactivateUser = onCall<{
  userId: string;
  reason?: string;
}>({ 
  cors: true,
  enforceAppCheck: true 
}, async (request) => {
  const { userId, reason } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify caller is admin or the user themselves
    if (!callerUid) {
      throw new Error("Authentication required");
    }
    
    const isAdmin = await verifyAdminRole(callerUid);
    const isSelfDeactivation = callerUid === userId;
    
    if (!isAdmin && !isSelfDeactivation) {
      throw new Error("Insufficient permissions");
    }
    
    // Deactivate user
    await db.collection('users').doc(userId).update({
      isActive: false,
      deactivatedAt: new Date(),
      deactivatedBy: callerUid,
      deactivationReason: reason || 'User requested',
      updatedAt: new Date(),
    });
    
    // Update custom claims
    await auth.setCustomUserClaims(userId, {
      isActive: false,
    });
    
    logger.info("User deactivated", { 
      userId, 
      reason, 
      deactivatedBy: callerUid 
    });
    
    return { success: true, message: "User deactivated successfully" };
    
  } catch (error) {
    logger.error("Error deactivating user", { 
      userId, 
      reason,
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function verifyAdminRole(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    logger.error("Error verifying admin role", { userId, error });
    return false;
  }
}