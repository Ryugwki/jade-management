import api from "@/lib/api/axiosInstance";
import type { Product } from "@/types/product";

export async function listProducts(): Promise<Product[]> {
  const response = await api.get("/products");
  return response.data.products as Product[];
}

export async function getProduct(id: string): Promise<Product> {
  const response = await api.get(`/products/${id}`);
  return response.data.product as Product;
}

export async function createProduct(
  payload: Partial<Product>,
): Promise<Product> {
  const response = await api.post("/products", payload);
  return response.data.product as Product;
}

export async function updateProduct(
  id: string,
  payload: Partial<Product>,
): Promise<Product> {
  const response = await api.put(`/products/${id}`, payload);
  return response.data.product as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function updateProductStatus(
  id: string,
  isActive: boolean,
): Promise<Product> {
  const response = await api.patch(`/products/${id}/status`, { isActive });
  return response.data.product as Product;
}
