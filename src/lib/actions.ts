
'use server';

import { z } from 'zod';
import { suggestProductCategory } from '@/ai/flows/suggest-product-category';

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
  storeName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function registerVendor(values: z.infer<typeof vendorRegistrationSchema>): Promise<{ success: boolean; message: string }> {
  const parsed = vendorRegistrationSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: 'Invalid form data.' };
  }
  
  // TODO: Implement actual registration logic (e.g., save to database, create auth user)
  console.log('Registering vendor:', parsed.data);

  // For now, we'll just simulate a successful registration
  return { success: true, message: 'Your store has been created! You can now list products.' };
}
