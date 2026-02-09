import api from "@/lib/api/axiosInstance";

export async function uploadImageBase64(image: string, folder?: string) {
  const response = await api.post("/uploads/image", { image, folder });
  return response.data as { url: string; public_id: string };
}

export async function deleteImageById(publicId: string) {
  const response = await api.delete("/uploads/image", {
    data: { public_id: publicId },
  });
  return response.data as { success: boolean };
}
