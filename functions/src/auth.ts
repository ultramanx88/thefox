import { onCall } from "firebase-functions/v2/https";
import { beforeUserCreated, beforeUserSignedIn } from "firebase-functions/v2/identity";
import { onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const auth = getAuth();
const db = getFirestore();

// ===========================================
// TYPES AND INTERFACES
// ===========================================

type UserRole = 'customer' | 'driver' | 'vendor' | 'admin';
type UserStatus = 'pending' | 'active' | 'suspended' | 'rejected';

interface CustomClaims {
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

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
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
 * Create user profile with role-based setup
 */
export const createUserWithRole = onCall<{
  email: string;
  password: string;
  role: 'customer' | 'driver' | 'vendor';
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth?: string;
  };
}>({ 
  cors: true 
}, async (request) => {
  const { email, password, role, profile } = request.data;
  
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${profile.firstName} ${profile.lastName}`,
      emailVerified: false,
    });
    
    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email,
      role,
      status: role === 'customer' ? 'active' : 'pending',
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
      },
      verification: {
        email: false,
        phone: false,
        documents: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection('users').doc(userRecord.uid).set(userProfile);
    
    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role,
      status: userProfile.status,
    });
    
    // Send email verification
    const link = await auth.generateEmailVerificationLink(email);
    
    logger.info("User created with role", { 
      uid: userRecord.uid, 
      email, 
      role 
    });
    
    return { 
      success: true, 
      uid: userRecord.uid,
      verificationLink: link,
      message: "User created successfully" 
    };
    
  } catch (error) {
    logger.error("Error creating user with role", { 
      email, 
      role,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Update user status (for admin approval)
 */
export const updateUserStatus = onCall<{
  userId: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  reason?: string;
}>({ 
  cors: true,
  enforceAppCheck: true 
}, async (request) => {
  const { userId, status, reason } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify caller is admin
    if (!callerUid) {
      throw new Error("Authentication required");
    }
    
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    // Update user status
    const updates: any = {
      status,
      updatedAt: new Date(),
      updatedBy: callerUid,
    };
    
    if (reason) {
      updates.statusReason = reason;
    }
    
    if (status === 'active') {
      updates.approvedAt = new Date();
      updates.approvedBy = callerUid;
    } else if (status === 'rejected') {
      updates.rejectedAt = new Date();
      updates.rejectedBy = callerUid;
    }
    
    await db.collection('users').doc(userId).update(updates);
    
    // Update custom claims
    await auth.setCustomUserClaims(userId, { status });
    
    // Create notification for user
    await db.collection('notifications').add({
      userId,
      type: 'status_update',
      title: `Account Status Updated`,
      message: `Your account status has been changed to ${status}${reason ? `: ${reason}` : ''}`,
      data: { status, reason },
      read: false,
      createdAt: new Date(),
    });
    
    logger.info("User status updated", { 
      userId, 
      status, 
      reason,
      updatedBy: callerUid 
    });
    
    return { success: true, message: "User status updated successfully" };
    
  } catch (error) {
    logger.error("Error updating user status", { 
      userId, 
      status,
      reason,
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
// EMAIL VERIFICATION FUNCTIONS
// ===========================================

/**
 * Send email verification
 */
export const sendEmailVerification = onCall<{
  userId: string;
}>({ 
  cors: true 
}, async (request) => {
  const { userId } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify caller is the user or admin
    if (!callerUid) {
      throw new Error("Authentication required");
    }
    
    const isAdmin = await verifyAdminRole(callerUid);
    if (callerUid !== userId && !isAdmin) {
      throw new Error("Insufficient permissions");
    }
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    if (!userData?.email) {
      throw new Error("User email not found");
    }
    
    // Generate verification link
    const link = await auth.generateEmailVerificationLink(userData.email);
    
    // Update verification status
    await db.collection('users').doc(userId).update({
      'verification.emailSent': true,
      'verification.emailSentAt': new Date(),
      updatedAt: new Date(),
    });
    
    logger.info("Email verification sent", { userId, email: userData.email });
    
    return { 
      success: true, 
      verificationLink: link,
      message: "Verification email sent successfully" 
    };
    
  } catch (error) {
    logger.error("Error sending email verification", { 
      userId,
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Verify email token
 */
export const verifyEmailToken = onCall<{
  token: string;
}>({ 
  cors: true 
}, async (request) => {
  const { token } = request.data;
  
  try {
    // Verify the token (this would typically involve checking against a stored token)
    // For now, we'll assume the token is valid if it exists
    if (!token) {
      throw new Error("Token is required");
    }
    
    // In a real implementation, you would:
    // 1. Decode the token to get user ID
    // 2. Verify token hasn't expired
    // 3. Check token against stored tokens
    
    // For this example, we'll extract userId from token (simplified)
    const userId = request.auth?.uid;
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Update verification status
    await db.collection('users').doc(userId).update({
      'verification.email': true,
      'verification.emailVerifiedAt': new Date(),
      updatedAt: new Date(),
    });
    
    // Update Firebase Auth email verification
    await auth.updateUser(userId, {
      emailVerified: true,
    });
    
    logger.info("Email verified successfully", { userId });
    
    return { 
      success: true, 
      message: "Email verified successfully" 
    };
    
  } catch (error) {
    logger.error("Error verifying email", { 
      token,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

// ===========================================
// REGISTRATION FUNCTIONS
// ===========================================

/**
 * Register customer with automatic approval
 */
export const registerCustomer = onCall<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string;
  acceptTerms: boolean;
}>({ 
  cors: true 
}, async (request) => {
  const { email, password, firstName, lastName, phone, dateOfBirth, acceptTerms } = request.data;
  
  try {
    if (!acceptTerms) {
      throw new Error("You must accept the terms and conditions to register.");
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email,
      role: 'customer' as UserRole,
      status: 'active' as UserStatus, // Customers are auto-approved
      profile: {
        firstName,
        lastName,
        phone,
        avatar: null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
      verification: {
        email: false,
        phone: false,
        documents: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    // Set custom claims
    const customClaims: CustomClaims = {
      role: 'customer',
      status: 'active',
      permissions: ROLE_PERMISSIONS.customer,
      verified: {
        email: false,
        phone: false,
        documents: false,
      },
      metadata: {
        lastUpdated: Date.now(),
      },
    };

    await auth.setCustomUserClaims(userRecord.uid, customClaims);

    // Generate email verification link
    const verificationLink = await auth.generateEmailVerificationLink(email);

    logger.info("Customer registered successfully", { 
      uid: userRecord.uid, 
      email 
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: 'Customer registration successful. Please check your email for verification.',
      verificationLink,
      requiresApproval: false,
      verificationRequired: {
        email: true,
        phone: false,
        documents: false,
      },
    };

  } catch (error: any) {
    logger.error("Error registering customer", { 
      email,
      error: error.message 
    });
    throw new Error(getAuthErrorMessage(error));
  }
});

/**
 * Register driver (requires approval)
 */
export const registerDriver = onCall<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  vehicleType: 'motorcycle' | 'car' | 'truck';
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
  availableAreas: string[];
  workingHours: any;
  acceptTerms: boolean;
}>({ 
  cors: true 
}, async (request) => {
  const data = request.data;
  
  try {
    if (!data.acceptTerms) {
      throw new Error("You must accept the terms and conditions to register.");
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
      emailVerified: false,
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: data.email,
      role: 'driver' as UserRole,
      status: 'pending' as UserStatus, // Drivers require approval
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatar: null,
        dateOfBirth: new Date(data.dateOfBirth),
      },
      verification: {
        email: false,
        phone: false,
        documents: false,
      },
      driverInfo: {
        nationalId: data.nationalId,
        dateOfBirth: new Date(data.dateOfBirth),
        licenseNumber: '', // To be filled during verification
        licenseExpiry: null,
        rating: 0,
        totalDeliveries: 0,
      },
      vehicle: {
        type: data.vehicleType,
        brand: data.vehicleBrand,
        model: data.vehicleModel,
        year: data.vehicleYear,
        licensePlate: data.licensePlate,
        color: '',
        capacity: 0,
      },
      availability: {
        areas: data.availableAreas,
        workingHours: data.workingHours,
        isOnline: false,
        currentLocation: null,
      },
      documents: {}, // Documents will be uploaded separately
      bankInfo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    // Create application record for admin review
    await db.collection('applications').add({
      userId: userRecord.uid,
      type: 'driver',
      status: 'pending',
      userData: {
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          nationalId: data.nationalId,
          dateOfBirth: data.dateOfBirth,
        },
        vehicleInfo: {
          type: data.vehicleType,
          brand: data.vehicleBrand,
          model: data.vehicleModel,
          year: data.vehicleYear,
          licensePlate: data.licensePlate,
        },
        availability: {
          areas: data.availableAreas,
          workingHours: data.workingHours,
        },
      },
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    });

    // Set custom claims
    const customClaims: CustomClaims = {
      role: 'driver',
      status: 'pending',
      permissions: [], // No permissions until approved
      verified: {
        email: false,
        phone: false,
        documents: false,
      },
      metadata: {
        lastUpdated: Date.now(),
      },
    };

    await auth.setCustomUserClaims(userRecord.uid, customClaims);

    // Generate email verification link
    const verificationLink = await auth.generateEmailVerificationLink(data.email);

    logger.info("Driver registered successfully", { 
      uid: userRecord.uid, 
      email: data.email 
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: 'Driver application submitted successfully. Your application will be reviewed by our team.',
      verificationLink,
      requiresApproval: true,
      verificationRequired: {
        email: true,
        phone: true,
        documents: true,
      },
    };

  } catch (error: any) {
    logger.error("Error registering driver", { 
      email: data.email,
      error: error.message 
    });
    throw new Error(getAuthErrorMessage(error));
  }
});

/**
 * Register vendor (requires approval)
 */
export const registerVendor = onCall<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  businessType: 'individual' | 'company';
  taxId?: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  coordinates: { lat: number; lng: number };
  categories: string[];
  description: string;
  operatingHours: any;
  acceptTerms: boolean;
}>({ 
  cors: true 
}, async (request) => {
  const data = request.data;
  
  try {
    if (!data.acceptTerms) {
      throw new Error("You must accept the terms and conditions to register.");
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
      emailVerified: false,
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: data.email,
      role: 'vendor' as UserRole,
      status: 'pending' as UserStatus, // Vendors require approval
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatar: null,
      },
      verification: {
        email: false,
        phone: false,
        documents: false,
      },
      businessInfo: {
        businessName: data.businessName,
        businessType: data.businessType,
        taxId: data.taxId,
        description: data.description,
        categories: data.categories,
        rating: 0,
        totalOrders: 0,
      },
      location: {
        address: data.address,
        district: data.district,
        province: data.province,
        postalCode: data.postalCode,
        coordinates: data.coordinates,
      },
      operatingHours: data.operatingHours,
      documents: {}, // Documents will be uploaded separately
      bankInfo: null,
      settings: {
        autoAcceptOrders: false,
        preparationTime: 30,
        minimumOrder: 0,
        deliveryRadius: 5,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    // Create application record for admin review
    await db.collection('applications').add({
      userId: userRecord.uid,
      type: 'vendor',
      status: 'pending',
      userData: {
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
        },
        businessInfo: {
          businessName: data.businessName,
          businessType: data.businessType,
          taxId: data.taxId,
          description: data.description,
          categories: data.categories,
        },
        location: {
          address: data.address,
          district: data.district,
          province: data.province,
          postalCode: data.postalCode,
          coordinates: data.coordinates,
        },
        operatingHours: data.operatingHours,
      },
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    });

    // Set custom claims
    const customClaims: CustomClaims = {
      role: 'vendor',
      status: 'pending',
      permissions: [], // No permissions until approved
      verified: {
        email: false,
        phone: false,
        documents: false,
      },
      metadata: {
        lastUpdated: Date.now(),
      },
    };

    await auth.setCustomUserClaims(userRecord.uid, customClaims);

    // Generate email verification link
    const verificationLink = await auth.generateEmailVerificationLink(data.email);

    logger.info("Vendor registered successfully", { 
      uid: userRecord.uid, 
      email: data.email 
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: 'Vendor application submitted successfully. Your application will be reviewed by our team.',
      verificationLink,
      requiresApproval: true,
      verificationRequired: {
        email: true,
        phone: false,
        documents: true,
      },
    };

  } catch (error: any) {
    logger.error("Error registering vendor", { 
      email: data.email,
      error: error.message 
    });
    throw new Error(getAuthErrorMessage(error));
  }
});

/**
 * Approve user application (Admin only)
 */
export const approveApplication = onCall<{
  applicationId: string;
  approved: boolean;
  reason?: string;
  notes?: string;
}>({ 
  cors: true,
  enforceAppCheck: true 
}, async (request) => {
  const { applicationId, approved, reason, notes } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify caller is admin
    if (!callerUid) {
      throw new Error("Authentication required");
    }
    
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Get application
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      throw new Error("Application not found");
    }

    const applicationData = applicationDoc.data();
    const userId = applicationData?.userId;

    if (!userId) {
      throw new Error("Invalid application data");
    }

    // Update application status
    await db.collection('applications').doc(applicationId).update({
      status: approved ? 'approved' : 'rejected',
      reviewedAt: new Date(),
      reviewedBy: callerUid,
      reviewNotes: notes || null,
      reason: reason || null,
    });

    // Update user status
    const newStatus: UserStatus = approved ? 'active' : 'rejected';
    await db.collection('users').doc(userId).update({
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: callerUid,
      ...(approved && { approvedAt: new Date(), approvedBy: callerUid }),
      ...(reason && { statusReason: reason }),
    });

    // Update custom claims
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userRole = userData?.role as UserRole;

    const customClaims: CustomClaims = {
      role: userRole,
      status: newStatus,
      permissions: approved ? ROLE_PERMISSIONS[userRole] || [] : [],
      verified: userData?.verification || {
        email: false,
        phone: false,
        documents: false,
      },
      metadata: {
        lastUpdated: Date.now(),
        ...(approved && { approvedBy: callerUid, approvedAt: Date.now() }),
      },
    };

    await auth.setCustomUserClaims(userId, customClaims);

    // Create notification for user
    await db.collection('notifications').add({
      userId,
      type: 'application_status',
      title: `Application ${approved ? 'Approved' : 'Rejected'}`,
      message: approved 
        ? 'Congratulations! Your application has been approved. You can now access all features.'
        : `Your application has been rejected. ${reason || 'Please contact support for more information.'}`,
      data: { 
        applicationId, 
        approved, 
        reason,
        reviewedBy: callerUid 
      },
      isRead: false,
      createdAt: new Date(),
    });

    logger.info("Application reviewed", { 
      applicationId, 
      userId,
      approved,
      reason,
      reviewedBy: callerUid 
    });

    return { 
      success: true, 
      message: `Application ${approved ? 'approved' : 'rejected'} successfully` 
    };

  } catch (error: any) {
    logger.error("Error reviewing application", { 
      applicationId,
      approved,
      callerUid,
      error: error.message 
    });
    throw error;
  }
});

/**
 * Update verification status
 */
export const updateVerificationStatus = onCall<{
  userId: string;
  verificationType: 'email' | 'phone' | 'documents';
  verified: boolean;
}>({ 
  cors: true,
  enforceAppCheck: true 
}, async (request) => {
  const { userId, verificationType, verified } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify caller is admin or the user themselves (for email/phone)
    if (!callerUid) {
      throw new Error("Authentication required");
    }
    
    const isAdmin = await verifyAdminRole(callerUid);
    const isSelfUpdate = callerUid === userId && verificationType !== 'documents';
    
    if (!isAdmin && !isSelfUpdate) {
      throw new Error("Insufficient permissions");
    }

    // Update user verification status
    await db.collection('users').doc(userId).update({
      [`verification.${verificationType}`]: verified,
      updatedAt: new Date(),
    });

    // Update custom claims
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData) {
      const customClaims: CustomClaims = {
        role: userData.role,
        status: userData.status,
        permissions: userData.status === 'active' ? ROLE_PERMISSIONS[userData.role] || [] : [],
        verified: {
          ...userData.verification,
          [verificationType]: verified,
        },
        metadata: {
          lastUpdated: Date.now(),
        },
      };

      await auth.setCustomUserClaims(userId, customClaims);
    }

    // Log verification action
    await db.collection('verificationLogs').add({
      userId,
      type: verificationType,
      verified,
      verifiedBy: callerUid,
      verifiedAt: new Date(),
    });

    logger.info("Verification status updated", { 
      userId, 
      verificationType, 
      verified,
      updatedBy: callerUid 
    });

    return { 
      success: true, 
      message: `${verificationType} verification ${verified ? 'completed' : 'revoked'} successfully` 
    };

  } catch (error: any) {
    logger.error("Error updating verification status", { 
      userId,
      verificationType,
      verified,
      callerUid,
      error: error.message 
    });
    throw error;
  }
});

/**
 * Triggered when user status changes
 */
export const onUserStatusChange = onDocumentUpdated("users/{userId}", async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();
  const userId = event.params.userId;

  if (!beforeData || !afterData) return;

  // Check if status changed
  if (beforeData.status !== afterData.status) {
    logger.info("User status changed", {
      userId,
      oldStatus: beforeData.status,
      newStatus: afterData.status,
    });

    // Update custom claims when status changes
    try {
      const customClaims: CustomClaims = {
        role: afterData.role,
        status: afterData.status,
        permissions: afterData.status === 'active' ? ROLE_PERMISSIONS[afterData.role] || [] : [],
        verified: afterData.verification || {
          email: false,
          phone: false,
          documents: false,
        },
        metadata: {
          lastUpdated: Date.now(),
        },
      };

      await auth.setCustomUserClaims(userId, customClaims);
      logger.info("Custom claims updated for status change", { userId });
    } catch (error) {
      logger.error("Error updating custom claims on status change", { userId, error });
    }
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

function getAuthErrorMessage(error: any): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please use a different email or try signing in.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password with at least 8 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password registration is not enabled. Please contact support.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}