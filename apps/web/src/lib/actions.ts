
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

const vendorRegistrationSchema = z.object({
  storeName: z.string().min(1, 'validation.storeNameRequired'),
  email: z.string().email('validation.invalidEmail'),
  password: z.string().min(8, 'validation.passwordLength'),
});

export async function registerVendor(values: z.infer<typeof vendorRegistrationSchema>): Promise<{ success: boolean; message: string }> {
  const parsed = vendorRegistrationSchema.safeParse(values);

  if (!parsed.success) {
      const errorMessages = parsed.error.issues.map(issue => issue.message).join(' ');
    return { success: false, message: `Invalid form data: ${errorMessages}` };
  }
  
  // TODO: Implement actual registration logic (e.g., save to database, create auth user)
  console.log('Registering vendor:', parsed.data);

  // For now, we'll just simulate a successful registration
  return { success: true, message: 'registrationSuccess' };
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
