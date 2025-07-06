
'use server';

import { z } from 'zod';
import { suggestProductCategory } from '@/ai/flows/suggest-product-category';
import { revalidatePath } from 'next/cache';
import { addCategory as addCategoryToDb } from '@/lib/categories';

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
