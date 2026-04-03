import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';

// Products
export const useProducts = (params?: { category?: string; search?: string; page?: number }) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiClient.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.getProduct(id),
    enabled: !!id,
  });
};

// Categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Search
export const useSearch = () => {
  return useMutation({
    mutationFn: ({ query, filters }: { query: string; filters?: any }) =>
      apiClient.search(query, filters),
  });
};

// Authentication
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: any) => apiClient.register(userData),
  });
};

// Cart
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      apiClient.addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.getCart(),
  });
};