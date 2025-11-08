// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = "dfqa2ojqr";
const CLOUDINARY_UPLOAD_PRESET = "Mentify";
const CLOUDINARY_IMAGE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_RAW_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;

// Upload Images
export const uploadImageToCloudinary = async (imageUri) => {
  try {
    console.log("📤 Uploading image to Cloudinary...");

    const data = new FormData();
    data.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: `image_${Date.now()}.jpg`,
    });
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_IMAGE_URL, {
      method: "POST",
      body: data,
      headers: {
        "Accept": "application/json",
      },
    });

    const result = await response.json();

    if (!result.secure_url) {
      console.error("❌ Upload failed:", result);
      throw new Error(result.error?.message || "Upload failed");
    }

    console.log("✅ Image uploaded:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary error:", error);
    throw error;
  }
};

// Upload PDFs
export const uploadPDFToCloudinary = async (fileUri, fileName) => {
  try {
    console.log("📤 Uploading PDF to Cloudinary...");

    const data = new FormData();
    data.append("file", {
      uri: fileUri,
      type: "application/pdf",
      name: fileName || `document_${Date.now()}.pdf`,
    });
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_RAW_URL, {
      method: "POST",
      body: data,
      headers: {
        "Accept": "application/json",
      },
    });

    const result = await response.json();

    if (!result.secure_url) {
      console.error("❌ PDF upload failed:", result);
      throw new Error(result.error?.message || "PDF upload failed");
    }

    console.log("✅ PDF uploaded:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("❌ PDF upload error:", error);
    throw error;
  }
};
