const cloudinary = require('cloudinary').v2;

const getCloudinaryConfig = () => ({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const isCloudinaryConfigured = () => {
  const config = getCloudinaryConfig();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

const getConfiguredCloudinaryClient = () => {
  if (!isCloudinaryConfigured()) {
    const error = new Error('Cloudinary is not configured');
    error.code = 'CLOUDINARY_NOT_CONFIGURED';
    throw error;
  }

  cloudinary.config(getCloudinaryConfig());
  return cloudinary;
};

const uploadDoctorImage = async (file) => {
  if (!file || !file.buffer) {
    return {
      imageUrl: '',
      imagePublicId: ''
    };
  }

  const client = getConfiguredCloudinaryClient();
  const mimeType = file.detectedMime || file.mimetype || 'application/octet-stream';
  const base64 = file.buffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64}`;

  const uploadResult = await client.uploader.upload(dataUri, {
    folder: 'hospital-management/doctors',
    resource_type: 'image'
  });

  return {
    imageUrl: uploadResult.secure_url || uploadResult.url || '',
    imagePublicId: uploadResult.public_id || ''
  };
};

const uploadDoctorImageFromFilePath = async (filePath) => {
  if (!filePath) {
    return {
      imageUrl: '',
      imagePublicId: ''
    };
  }

  const client = getConfiguredCloudinaryClient();
  const uploadResult = await client.uploader.upload(filePath, {
    folder: 'hospital-management/doctors',
    resource_type: 'image'
  });

  return {
    imageUrl: uploadResult.secure_url || uploadResult.url || '',
    imagePublicId: uploadResult.public_id || ''
  };
};

const removeCloudinaryImage = async (publicId) => {
  if (!publicId) return;
  if (!isCloudinaryConfigured()) return;

  const client = getConfiguredCloudinaryClient();
  await client.uploader.destroy(publicId, { resource_type: 'image' });
};

module.exports = {
  uploadDoctorImage,
  uploadDoctorImageFromFilePath,
  removeCloudinaryImage,
  isCloudinaryConfigured
};
