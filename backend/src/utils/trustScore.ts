import { IRiderProfile, TrustLevel } from '../models/RiderProfile';

export function calculateTrustScore(profile: IRiderProfile): { score: number; level: TrustLevel } {
  let score = 0;

  // Verification (25 points)
  if (profile.verificationStatus === 'approved') score += 25;

  // Rating (20 points)
  if (profile.rating > 0) score += (profile.rating / 5) * 20;

  // Completed trips (25 points, cap at 100)
  score += Math.min(profile.completedTrips / 100, 1) * 25;

  // Cancellation rate (10 points, 0% = full, 100% = 0)
  score += (1 - profile.cancellationRate / 100) * 10;

  // Safety score (10 points)
  score += (profile.safetyScore / 100) * 10;

  // Insurance (5 points)
  if (profile.insuranceStatus) score += 5;

  // Profile completeness (5 points)
  const fields = [profile.coverPhoto, profile.photos.length > 0, profile.prompts.length > 0, profile.languages.length > 0];
  score += (fields.filter(Boolean).length / fields.length) * 5;

  const finalScore = Math.round(Math.min(100, Math.max(0, score)));

  let level: TrustLevel = 'bronze';
  if (finalScore >= 70) level = 'gold';
  else if (finalScore >= 40) level = 'silver';

  return { score: finalScore, level };
}
