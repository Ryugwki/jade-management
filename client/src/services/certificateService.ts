import api from "@/lib/api/axiosInstance";
import type { Certificate } from "@/types/certificate";

export async function listCertificates(
  productId?: string,
): Promise<Certificate[]> {
  const response = await api.get("/certificates", {
    params: productId ? { productId } : undefined,
  });
  return response.data.certificates as Certificate[];
}

export async function getCertificate(id: string): Promise<Certificate> {
  const response = await api.get(`/certificates/${id}`);
  return response.data.certificate as Certificate;
}

export async function createCertificate(
  payload: Partial<Certificate>,
): Promise<Certificate> {
  const response = await api.post("/certificates", payload);
  return response.data.certificate as Certificate;
}

export async function updateCertificate(
  id: string,
  payload: Partial<Certificate>,
): Promise<Certificate> {
  const response = await api.put(`/certificates/${id}`, payload);
  return response.data.certificate as Certificate;
}

export async function deleteCertificate(id: string): Promise<void> {
  await api.delete(`/certificates/${id}`);
}
