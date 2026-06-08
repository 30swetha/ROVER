import { IRiderProfile } from '../models/RiderProfile';
import { IUser } from '../models/User';

interface RequestContext {
  pickupCity: string;
  destinationCity: string;
  budget: number;
}

export function calculateMatchScore(
  rider: IRiderProfile & { userInfo?: IUser },
  request: RequestContext,
): number {
  let score = 0;
  const weights = {
    routeExpertise: 30,
    rating: 25,
    completedTrips: 20,
    verificationStatus: 15,
    responseTime: 10,
  };

  // Route expertise match
  const route = `${request.pickupCity}-${request.destinationCity}`.toLowerCase();
  const hasRouteExpertise = rider.routeExpertise.some(
    r => route.includes(r.toLowerCase()) || r.toLowerCase().includes(request.pickupCity.toLowerCase()),
  );
  score += hasRouteExpertise ? weights.routeExpertise : weights.routeExpertise * 0.3;

  // Rating score (max 5 → scale to weight)
  const ratingScore = rider.rating > 0 ? (rider.rating / 5) * weights.rating : weights.rating * 0.5;
  score += ratingScore;

  // Completed trips score (cap at 50 trips for full score)
  const tripsScore = Math.min(rider.completedTrips / 50, 1) * weights.completedTrips;
  score += tripsScore;

  // Verification status
  score += rider.verificationStatus === 'approved' ? weights.verificationStatus : 0;

  // Response time (lower is better; assume avg < 30 min is excellent)
  const responseScore = rider.avgResponseTime > 0
    ? Math.max(0, 1 - rider.avgResponseTime / 120) * weights.responseTime
    : weights.responseTime * 0.7;
  score += responseScore;

  return Math.round(Math.min(100, Math.max(0, score)));
}
