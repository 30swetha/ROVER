import multer from 'multer';
import { Request } from 'express';
import { cloudinary } from '../config/cloudinary';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video' | 'auto' = 'image',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      (result: any) => {
        if (!result) return reject(new Error('Upload failed'));
        if (result.error) return reject(result.error);
        resolve(result.secure_url);
      },
      { folder: `rover/${folder}`, resource_type: resourceType },
    );
    uploadStream.end(buffer);
  });
}
