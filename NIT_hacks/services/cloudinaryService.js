import * as FileSystem from "expo-file-system";

const CLOUDINARY_CLOUD_NAME = "skillswaping";
const CLOUDINARY_UPLOAD_PRESET = "nit";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const uploadImageToCloudinary = async (imageUri) => {
  try {
    console.log("📤 Uploading image to Cloudinary...");

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create form data
    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64}`);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "profile_pictures"); // Optional: organize in folders

    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.secure_url) {
      console.log("✅ Image uploaded:", data.secure_url);
      return data.secure_url; // Return Cloudinary URL
    } else {
      throw new Error("Upload failed");
    }
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw error;
  }
};
