import { z } from 'zod';

export const RoleSchema = z.enum(['customer', 'vendor', 'admin', 'superadmin']);

export const AuthProviderSchema = z.enum(['line', 'google', 'apple']);

export const AuthSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string().datetime(),
  tokenType: z.literal('Bearer')
});

export const OAuthExchangeSchema = z.object({
  provider: AuthProviderSchema,
  code: z.string().min(1),
  codeVerifier: z.string().min(16),
  redirectUri: z.string().url(),
  platform: z.enum(['web', 'pwa', 'expo'])
});

export const RefreshSessionSchema = z.object({
  refreshToken: z.string().min(1)
});

export const ProductSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  unit: z.string().min(1).max(40),
  category: z.string().min(1).max(80),
  imageUrl: z.string().url(),
  vendorId: z.string().min(1).max(128),
  stock: z.number().int().min(0),
  description: z.string().min(1).max(1000)
});

export const UserProfileSchema = z.object({
  id: z.string().min(1).max(128),
  email: z.string().email(),
  displayName: z.string().min(1).max(100).nullable(),
  photoUrl: z.string().url().nullable(),
  role: RoleSchema
});

export const AuthResultSchema = z.object({
  user: UserProfileSchema,
  session: AuthSessionSchema
});

export const CartItemSchema = z.object({
  productId: z.string().min(1).max(128),
  quantity: z.number().int().positive()
});

export const CreateOrderSchema = z.object({
  items: z.array(CartItemSchema).min(1).max(100)
});

export type Role = z.infer<typeof RoleSchema>;
export type AuthProvider = z.infer<typeof AuthProviderSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type OAuthExchangeInput = z.infer<typeof OAuthExchangeSchema>;
export type RefreshSessionInput = z.infer<typeof RefreshSessionSchema>;
export type AuthResult = z.infer<typeof AuthResultSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
