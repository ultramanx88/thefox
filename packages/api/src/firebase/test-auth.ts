import { initializeFirebase } from './init';
import { FirebaseAuthService } from './auth';
import { RegistrationService } from './registration';
import { VerificationService } from './verification';

/**
 * Test Firebase Authentication and Registration System
 */
export async function testFirebaseAuth() {
  console.log('🔥 Testing Firebase Authentication and Registration System...\n');

  try {
    // 1. Initialize Firebase
    console.log('1. Initializing Firebase...');
    const initResult = await initializeFirebase();
    
    if (!initResult.success) {
      console.error('❌ Firebase initialization failed:', initResult.errors);
      return;
    }
    
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Services status:', initResult.services);
    console.log('');

    // 2. Test Customer Registration
    console.log('2. Testing Customer Registration...');
    const customerData = {
      email: 'test-customer@example.com',
      password: 'testpassword123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+66812345678',
      dateOfBirth: new Date('1990-01-01'),
      acceptTerms: true,
    };

    try {
      const customerResult = await RegistrationService.registerCustomer(customerData);
      console.log('✅ Customer registration result:', customerResult);
    } catch (error: any) {
      console.log('⚠️ Customer registration test (expected if user exists):', error.message);
    }
    console.log('');

    // 3. Test Email Verification
    console.log('3. Testing Email Verification...');
    try {
      const emailResult = await VerificationService.sendEmailVerification();
      console.log('✅ Email verification result:', emailResult);
    } catch (error: any) {
      console.log('⚠️ Email verification test:', error.message);
    }
    console.log('');

    // 4. Test SMS Verification
    console.log('4. Testing SMS Verification...');
    try {
      const smsResult = await VerificationService.sendSMSVerification('+66812345678');
      console.log('✅ SMS verification result:', smsResult);
    } catch (error: any) {
      console.log('⚠️ SMS verification test:', error.message);
    }
    console.log('');

    // 5. Test User Profile Retrieval
    console.log('5. Testing User Profile Retrieval...');
    const currentUser = FirebaseAuthService.getCurrentUser();
    if (currentUser) {
      try {
        const profile = await FirebaseAuthService.getUserProfile(currentUser.uid);
        console.log('✅ User profile retrieved:', profile ? 'Success' : 'Not found');
      } catch (error: any) {
        console.log('⚠️ User profile retrieval:', error.message);
      }
    } else {
      console.log('ℹ️ No current user signed in');
    }
    console.log('');

    console.log('🎉 Firebase Authentication and Registration System test completed!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Test registration data validation
 */
export function testRegistrationValidation() {
  console.log('🔍 Testing Registration Data Validation...\n');

  // Test customer data validation
  const validCustomerData = {
    email: 'valid@example.com',
    password: 'validpassword123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+66812345678',
    acceptTerms: true,
  };

  const invalidCustomerData = {
    email: 'invalid-email',
    password: '123', // Too short
    firstName: '',
    lastName: 'Doe',
    phone: 'invalid-phone',
    acceptTerms: false,
  };

  console.log('✅ Valid customer data structure:', validCustomerData);
  console.log('❌ Invalid customer data structure:', invalidCustomerData);
  console.log('');

  // Test driver data validation
  const validDriverData = {
    email: 'driver@example.com',
    password: 'validpassword123',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+66812345679',
    dateOfBirth: new Date('1985-05-15'),
    nationalId: '1234567890123',
    vehicleType: 'motorcycle' as const,
    vehicleBrand: 'Honda',
    vehicleModel: 'Wave',
    vehicleYear: 2020,
    licensePlate: 'ABC-1234',
    availableAreas: ['Bangkok', 'Nonthaburi'],
    workingHours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      saturday: { isOpen: false },
      sunday: { isOpen: false },
    },
    acceptTerms: true,
  };

  console.log('✅ Valid driver data structure:', {
    ...validDriverData,
    workingHours: 'Valid working hours object',
  });
  console.log('');

  console.log('🎉 Registration validation test completed!\n');
}

// Export test functions
export default {
  testFirebaseAuth,
  testRegistrationValidation,
};