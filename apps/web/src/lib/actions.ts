
'use server';

import { z } from 'zod';
import { suggestProductCategory } from '@/ai/flows/suggest-product-category';
import { revalidatePath } from 'next/cache';
import { addCategory as addCategoryToDb } from '@/lib/categories';
import { updateInvestorInfo, type BankInfo } from '@/lib/investment';
import {
  addServiceArea as addServiceAreaToDb,
  updateServiceArea as updateServiceAreaToDb,
  deleteServiceArea as deleteServiceAreaFromDb,
  type ServiceArea,
} from '@/lib/serviceAreas';

export interface ActionState {
  error?: string;
  suggestions?: string[];
}

export async function suggestCategories(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const productImage = formData.get('productImage') as string;

  if (!productImage) {
    return { error: 'Please select an image.' };
  }
  
  if (!productImage.startsWith('data:image/')) {
    return { error: 'Invalid image format. Please upload a valid image file.' };
  }

  try {
    const result = await suggestProductCategory({ productImage });
    return { suggestions: result.suggestedCategories };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to suggest categories. Please try again.' };
  }
}

// ===========================================
// REGISTRATION SCHEMAS AND ACTIONS
// ===========================================

const customerRegistrationSchema = z.object({
  firstName: z.string().min(1, 'validation.firstNameRequired'),
  lastName: z.string().min(1, 'validation.lastNameRequired'),
  email: z.string().email('validation.invalidEmail'),
  phone: z.string().min(10, 'validation.phoneRequired'),
  password: z.string().min(8, 'validation.passwordLength'),
  confirmPassword: z.string().min(8, 'validation.confirmPasswordRequired'),
  dateOfBirth: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'validation.acceptTermsRequired',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.passwordMismatch',
  path: ["confirmPassword"],
});

export async function registerCustomer(values: z.infer<typeof customerRegistrationSchema>): Promise<{ success: boolean; message: string; userId?: string }> {
  const parsed = customerRegistrationSchema.safeParse(values);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message).join(' ');
    return { success: false, message: `Invalid form data: ${errorMessages}` };
  }

  try {
    // Import Firebase functions
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('@repo/api/firebase/config');
    
    // Call Firebase function to register customer
    const registerCustomerFunction = httpsCallable(functions, 'registerCustomer');
    
    const registrationData = {
      email: parsed.data.email,
      password: parsed.data.password,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      dateOfBirth: parsed.data.dateOfBirth || undefined,
      acceptTerms: parsed.data.acceptTerms,
    };

    const result = await registerCustomerFunction(registrationData);
    const data = result.data as any;

    if (data.success) {
      return {
        success: true,
        message: data.message,
        userId: data.userId,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Registration failed',
      };
    }
  } catch (error: any) {
    console.error('Customer registration error:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred during registration',
    };
  }
}

const driverRegistrationSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, 'validation.firstNameRequired'),
  lastName: z.string().min(1, 'validation.lastNameRequired'),
  email: z.string().email('validation.invalidEmail'),
  phone: z.string().min(10, 'validation.phoneRequired'),
  password: z.string().min(8, 'validation.passwordLength'),
  confirmPassword: z.string().min(8, 'validation.confirmPasswordRequired'),
  dateOfBirth: z.string().min(1, 'validation.dateOfBirthRequired'),
  nationalId: z.string().min(13, 'validation.nationalIdRequired'),
  
  // Vehicle Information
  vehicleType: z.enum(['motorcycle', 'car', 'truck']),
  vehicleBrand: z.string().min(1, 'validation.vehicleBrandRequired'),
  vehicleModel: z.string().min(1, 'validation.vehicleModelRequired'),
  vehicleYear: z.number().min(2000, 'validation.vehicleYearRequired'),
  licensePlate: z.string().min(1, 'validation.licensePlateRequired'),
  
  // Availability
  availableAreas: z.array(z.string()).min(1, 'validation.availableAreasRequired'),
  workingHours: z.any(),
  
  // Documents
  documents: z.object({
    idCard: z.any(),
    driverLicense: z.any(),
    vehicleRegistration: z.any(),
    profilePhoto: z.any(),
  }),
  
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'validation.acceptTermsRequired',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.passwordMismatch',
  path: ["confirmPassword"],
});

export async function registerDriver(values: z.infer<typeof driverRegistrationSchema>): Promise<{ success: boolean; message: string; userId?: string }> {
  const parsed = driverRegistrationSchema.safeParse(values);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message).join(' ');
    return { success: false, message: `Invalid form data: ${errorMessages}` };
  }

  try {
    // Import Firebase functions
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('@repo/api/firebase/config');
    
    // Call Firebase function to register driver
    const registerDriverFunction = httpsCallable(functions, 'registerDriver');
    
    const registrationData = {
      email: parsed.data.email,
      password: parsed.data.password,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      dateOfBirth: parsed.data.dateOfBirth,
      nationalId: parsed.data.nationalId,
      vehicleType: parsed.data.vehicleType,
      vehicleBrand: parsed.data.vehicleBrand,
      vehicleModel: parsed.data.vehicleModel,
      vehicleYear: parsed.data.vehicleYear,
      licensePlate: parsed.data.licensePlate,
      availableAreas: parsed.data.availableAreas,
      workingHours: parsed.data.workingHours,
      acceptTerms: parsed.data.acceptTerms,
    };

    const result = await registerDriverFunction(registrationData);
    const data = result.data as any;

    if (data.success) {
      return {
        success: true,
        message: data.message,
        userId: data.userId,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Registration failed',
      };
    }
  } catch (error: any) {
    console.error('Driver registration error:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred during registration',
    };
  }
}

const vendorRegistrationSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, 'validation.firstNameRequired'),
  lastName: z.string().min(1, 'validation.lastNameRequired'),
  email: z.string().email('validation.invalidEmail'),
  phone: z.string().min(10, 'validation.phoneRequired'),
  password: z.string().min(8, 'validation.passwordLength'),
  confirmPassword: z.string().min(8, 'validation.confirmPasswordRequired'),
  
  // Business Information
  businessName: z.string().min(1, 'validation.businessNameRequired'),
  businessType: z.enum(['individual', 'company']),
  taxId: z.string().optional(),
  alternativePhone: z.string().optional(),
  
  // Location Information
  address: z.string().min(1, 'validation.addressRequired'),
  district: z.string().min(1, 'validation.districtRequired'),
  province: z.string().min(1, 'validation.provinceRequired'),
  postalCode: z.string().min(5, 'validation.postalCodeRequired'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  
  // Business Details
  categories: z.array(z.string()).min(1, 'validation.categoriesRequired'),
  description: z.string().min(1, 'validation.descriptionRequired'),
  operatingHours: z.any(),
  
  // Documents
  documents: z.object({
    businessLicense: z.any().optional(),
    idCard: z.any(),
    bankBook: z.any(),
    storePhotos: z.array(z.any()),
  }),
  
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'validation.acceptTermsRequired',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.passwordMismatch',
  path: ["confirmPassword"],
});

export async function registerVendor(values: z.infer<typeof vendorRegistrationSchema>): Promise<{ success: boolean; message: string; userId?: string }> {
  const parsed = vendorRegistrationSchema.safeParse(values);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message).join(' ');
    return { success: false, message: `Invalid form data: ${errorMessages}` };
  }

  try {
    // Import Firebase functions
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('@repo/api/firebase/config');
    
    // Call Firebase function to register vendor
    const registerVendorFunction = httpsCallable(functions, 'registerVendor');
    
    const registrationData = {
      email: parsed.data.email,
      password: parsed.data.password,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      businessName: parsed.data.businessName,
      businessType: parsed.data.businessType,
      taxId: parsed.data.taxId,
      address: parsed.data.address,
      district: parsed.data.district,
      province: parsed.data.province,
      postalCode: parsed.data.postalCode,
      coordinates: parsed.data.coordinates,
      categories: parsed.data.categories,
      description: parsed.data.description,
      operatingHours: parsed.data.operatingHours,
      acceptTerms: parsed.data.acceptTerms,
    };

    const result = await registerVendorFunction(registrationData);
    const data = result.data as any;

    if (data.success) {
      return {
        success: true,
        message: data.message,
        userId: data.userId,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Registration failed',
      };
    }
  } catch (error: any) {
    console.error('Vendor registration error:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred during registration',
    };
  }
}


export async function addCategoryAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const categoryName = formData.get('categoryName') as string;

  if (!categoryName || categoryName.trim().length === 0) {
    return { error: 'Category name is required.' };
  }

  try {
    await addCategoryToDb(categoryName);
    revalidatePath('/[locale]/admin/categories', 'page');
    revalidatePath('/[locale]', 'page');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to add category.' };
  }
}

const updateInvestorSchema = z.object({
  investorId: z.string(),
  name: z.string().min(1, 'Name is required.'),
  bank_name: z.string().min(1, 'Bank name is required.'),
  account_name: z.string().min(1, 'Account name is required.'),
  account_number: z.string().min(1, 'Account number is required.'),
});

export async function updateInvestorAction(
  prevState: { error?: string; success?: boolean, message?: string },
  formData: FormData
): Promise<{ error?: string; success?: boolean, message?: string }> {
  const validatedFields = updateInvestorSchema.safeParse({
    investorId: formData.get('investorId'),
    name: formData.get('name'),
    bank_name: formData.get('bank_name'),
    account_name: formData.get('account_name'),
    account_number: formData.get('account_number'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.toString(),
    };
  }
  
  const { investorId, name, bank_name, account_name, account_number } = validatedFields.data;
  const bankInfo: BankInfo = { bank_name, account_name, account_number };

  try {
    const result = await updateInvestorInfo(investorId, {
      name: name,
      bank_info: bankInfo
    });

    if (!result.success) {
      return { error: result.message };
    }
    
    revalidatePath('/[locale]/admin/investment', 'page');
    return { success: true, message: 'Investor updated successfully.' };

  } catch (e) {
    console.error(e);
    return { error: 'Failed to update investor.' };
  }
}


// --- Service Area Actions ---

export interface ServiceAreaActionState {
  error?: string;
  success?: boolean;
}

const baseAreaSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    status: z.enum(['active', 'inactive']),
});

const administrativeSchema = baseAreaSchema.extend({
  type: z.literal('administrative'),
  province: z.string().min(1, 'Province is required.'),
  districts: z.string().min(1, 'At least one district is required.'),
});

const radiusSchema = baseAreaSchema.extend({
  type: z.literal('radius'),
  lat: z.coerce.number().min(-90, 'Invalid Latitude').max(90, 'Invalid Latitude'),
  lng: z.coerce.number().min(-180, 'Invalid Longitude').max(180, 'Invalid Longitude'),
  radius: z.coerce.number().positive('Radius must be a positive number.'),
});

const serviceAreaSchema = z.discriminatedUnion('type', [
  administrativeSchema,
  radiusSchema,
]);


export async function addServiceAreaAction(
  prevState: ServiceAreaActionState,
  formData: FormData
): Promise<ServiceAreaActionState> {
  const rawData = {
    type: formData.get('type'),
    name: formData.get('name'),
    status: formData.get('status') === 'on' ? 'active' : 'inactive',
    province: formData.get('province'),
    districts: formData.get('districts'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
    radius: formData.get('radius'),
  };

  const validatedFields = serviceAreaSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten());
    return { error: 'Invalid data. Please check all fields.' };
  }

  try {
    let dataToAdd: Omit<ServiceArea, 'id'>;
    const { name, status } = validatedFields.data;

    if (validatedFields.data.type === 'administrative') {
      const { province } = validatedFields.data;
      const districts = validatedFields.data.districts.split(',').map(d => d.trim()).filter(Boolean);
      dataToAdd = { type: 'administrative', name, province, districts, status };
    } else { // type === 'radius'
      const { lat, lng, radius } = validatedFields.data;
      dataToAdd = { type: 'radius', name, lat, lng, radius, status };
    }
    
    await addServiceAreaToDb(dataToAdd);
    revalidatePath('/[locale]/admin/service-areas', 'page');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to add service area.' };
  }
}

export async function updateServiceAreaAction(
  prevState: ServiceAreaActionState,
  formData: FormData
): Promise<ServiceAreaActionState> {
  const id = formData.get('id') as string;
  if (!id) {
    return { error: 'Area ID is missing.' };
  }

  const rawData = {
    type: formData.get('type'),
    name: formData.get('name'),
    status: formData.get('status') === 'on' ? 'active' : 'inactive',
    province: formData.get('province'),
    districts: formData.get('districts'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
    radius: formData.get('radius'),
  };

  const validatedFields = serviceAreaSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: 'Invalid data. Please check all fields.' };
  }
  
  try {
    let dataToUpdate: Partial<Omit<ServiceArea, 'id'>>;
    const { name, status } = validatedFields.data;

    if (validatedFields.data.type === 'administrative') {
      const { province } = validatedFields.data;
      const districts = validatedFields.data.districts.split(',').map(d => d.trim()).filter(Boolean);
      dataToUpdate = { type: 'administrative', name, province, districts, status };
    } else { // type === 'radius'
      const { lat, lng, radius } = validatedFields.data;
      dataToUpdate = { type: 'radius', name, lat, lng, radius, status };
    }

    await updateServiceAreaToDb(id, dataToUpdate);
    revalidatePath('/[locale]/admin/service-areas', 'page');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to update service area.' };
  }
}


export async function deleteServiceAreaAction(
  prevState: ServiceAreaActionState,
  formData: FormData
): Promise<ServiceAreaActionState> {
  const id = formData.get('id') as string;
  if (!id) {
    return { error: 'Area ID is missing.' };
  }

  try {
    await deleteServiceAreaFromDb(id);
    revalidatePath('/[locale]/admin/service-areas', 'page');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to delete service area.' };
  }
}
