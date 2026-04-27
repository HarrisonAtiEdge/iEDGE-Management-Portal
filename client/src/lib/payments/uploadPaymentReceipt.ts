export async function uploadPaymentReceipt(file: File | null) {
  if (!file) return "";

  const CLOUD_NAME = "iedge-system-travel-uploads";
  const UPLOAD_PRESET = "cloud-water";

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary environment variables are missing");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: form,
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to upload receipt");
  }

  return data.secure_url || "";
}
