import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const UPLOAD_PRESETS = {
  avatars: 'rover_avatars',
  documents: 'rover_documents',
  bikeImages: 'rover_bikes',
  posts: 'rover_posts',
  reels: 'rover_reels',
  riderMedia: 'rover_rider_media',
} as const;
