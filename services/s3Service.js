import AWS from 'aws-sdk';
import path from 'path';
import dotenv from 'dotenv';


dotenv.config();

// Initialize S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Upload a banner image to S3
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {string} customName - Custom name for the file (optional)
 * @returns {Promise<{url: string, key: string}>} - Returns S3 URL and key
 */
export const uploadBannerToS3 = async (buffer, originalName, customName = null) => {
  try {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const baseName = customName || path.basename(originalName, ext);
    const key = `indiraa1/banners/${baseName}-${timestamp}${ext}`;
    
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: getContentType(ext),
      ACL: 'public-read',
      Metadata: {
        'original-name': originalName,
        'upload-type': 'banner',
        'uploaded-at': new Date().toISOString()
      }
    };
    
    const data = await s3.upload(params).promise();
    
    return {
      url: data.Location,
      key: data.Key,
      bucket: BUCKET,
      etag: data.ETag
    };
  } catch (error) {
    console.error('Error uploading banner to S3:', error);
    throw new Error(`Failed to upload banner: ${error.message}`);
  }
};

/**
 * Upload a product image to S3 (existing functionality)
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {string} productName - Product name for folder organization
 * @returns {Promise<string>} - Returns S3 URL
 */
export const uploadProductImageToS3 = async (buffer, originalName, productName) => {
  try {
    const ext = path.extname(originalName);
    const key = `indiraa1/products/${productName}/${Date.now()}${ext}`;
    
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: getContentType(ext),
      ACL: 'public-read',
      Metadata: {
        'original-name': originalName,
        'upload-type': 'product',
        'product-name': productName,
        'uploaded-at': new Date().toISOString()
      }
    };
    
    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (error) {
    console.error('Error uploading product image to S3:', error);
    throw new Error(`Failed to upload product image: ${error.message}`);
  }
};

/**
 * Upload a combo pack image to S3
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {string} comboPackName - Combo pack name for folder organization
 * @returns {Promise<{url: string, key: string}>} - Returns S3 URL and key
 */
export const uploadComboPackImageToS3 = async (buffer, originalName, comboPackName) => {
  try {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const key = `indiraa1/combo-packs/${comboPackName}/${timestamp}${ext}`;
    
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: getContentType(ext),
      ACL: 'public-read',
      Metadata: {
        'original-name': originalName,
        'upload-type': 'combo-pack',
        'combo-pack-name': comboPackName,
        'uploaded-at': new Date().toISOString()
      }
    };
    
    const data = await s3.upload(params).promise();
    
    return {
      url: data.Location,
      key: data.Key,
      bucket: BUCKET,
      etag: data.ETag
    };
  } catch (error) {
    console.error('Error uploading combo pack image to S3:', error);
    throw new Error(`Failed to upload combo pack image: ${error.message}`);
  }
};

/**
 * Delete an image from S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - Returns true if deleted successfully
 */
export const deleteImageFromS3 = async (key) => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    console.log(`Successfully deleted image: ${key}`);
    return true;
  } catch (error) {
    console.error('Error deleting image from S3:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Get a signed URL for temporary access to a private image
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} - Returns signed URL
 */
export const getSignedUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: key,
      Expires: expiresIn
    };
    
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * List all images in a specific folder
 * @param {string} prefix - Folder prefix (e.g., 'indiraa1/banners/')
 * @param {number} maxKeys - Maximum number of keys to return (default: 1000)
 * @returns {Promise<Array>} - Returns array of object information
 */
export const listImagesInFolder = async (prefix, maxKeys = 1000) => {
  try {
    const params = {
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys
    };
    
    const data = await s3.listObjectsV2(params).promise();
    
    return data.Contents.map(obj => ({
      key: obj.Key,
      lastModified: obj.LastModified,
      size: obj.Size,
      storageClass: obj.StorageClass,
      url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`
    }));
  } catch (error) {
    console.error('Error listing images from S3:', error);
    throw new Error(`Failed to list images: ${error.message}`);
  }
};

/**
 * Check if an image exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - Returns true if image exists
 */
export const imageExistsInS3 = async (key) => {
  try {
    await s3.headObject({
      Bucket: BUCKET,
      Key: key
    }).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Get image metadata from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} - Returns image metadata
 */
export const getImageMetadata = async (key) => {
  try {
    const data = await s3.headObject({
      Bucket: BUCKET,
      Key: key
    }).promise();
    
    return {
      contentType: data.ContentType,
      contentLength: data.ContentLength,
      lastModified: data.LastModified,
      etag: data.ETag,
      metadata: data.Metadata
    };
  } catch (error) {
    console.error('Error getting image metadata from S3:', error);
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
};

/**
 * Generate multiple sizes of a banner image (for responsive design)
 * @param {Buffer} buffer - Original image buffer
 * @param {string} originalName - Original filename
 * @param {string} customName - Custom name for the file
 * @returns {Promise<Object>} - Returns URLs for different sizes
 */
export const uploadBannerWithSizes = async (buffer, originalName, customName = null) => {
  try {
    // For now, we'll upload the original image
    // In the future, you can add image resizing logic here using Sharp
    const originalUpload = await uploadBannerToS3(buffer, originalName, customName);
    
    return {
      original: originalUpload,
      // Future: Add different sizes
      // desktop: desktopUpload,
      // tablet: tabletUpload,
      // mobile: mobileUpload
    };
  } catch (error) {
    console.error('Error uploading banner with multiple sizes:', error);
    throw new Error(`Failed to upload banner with sizes: ${error.message}`);
  }
};

/**
 * Get content type based on file extension
 * @param {string} ext - File extension
 * @returns {string} - MIME type
 */
const getContentType = (ext) => {
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.ico': 'image/x-icon'
  };
  
  return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
};

/**
 * Validate image file
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {Object} options - Validation options
 * @returns {boolean} - Returns true if valid
 */
export const validateImageFile = (buffer, originalName, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    minWidth = 800,
    minHeight = 400
  } = options;
  
  // Check file size
  if (buffer.length > maxSize) {
    throw new Error(`File size too large. Maximum allowed: ${maxSize / 1024 / 1024}MB`);
  }
  
  // Check file extension
  const ext = path.extname(originalName).toLowerCase();
  if (!allowedTypes.includes(ext)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Additional validation can be added here (image dimensions, etc.)
  // This would require an image processing library like Sharp
  
  return true;
};

export default {
  uploadBannerToS3,
  uploadProductImageToS3,
  uploadComboPackImageToS3,
  deleteImageFromS3,
  getSignedUrl,
  listImagesInFolder,
  imageExistsInS3,
  getImageMetadata,
  uploadBannerWithSizes,
  validateImageFile
};
