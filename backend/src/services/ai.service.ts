import OpenAI from 'openai';
import { IRiderProfile } from '../models/RiderProfile';
import { IUser } from '../models/User';
import { calculateMatchScore } from '../utils/matchScore';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

interface RiderWithUser {
  profile: IRiderProfile;
  user: IUser;
}

export async function getAIRiderRecommendations(
  riders: RiderWithUser[],
  request: { pickupCity: string; destinationCity: string; budget: number },
): Promise<string[]> {
  const scores = riders.map(r => ({
    id: (r.profile.userId as unknown as { toString(): string }).toString(),
    score: calculateMatchScore(r.profile, request),
    trips: r.profile.completedTrips,
    rating: r.profile.rating,
    verified: r.profile.verificationStatus === 'approved',
  }));

  scores.sort((a, b) => b.score - a.score || b.rating - a.rating || b.trips - a.trips);
  return scores.slice(0, 5).map(s => s.id);
}

export async function suggestBudget(pickupCity: string, destinationCity: string): Promise<number> {
  try {
    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Suggest a fair budget in INR for bike relocation from ${pickupCity} to ${destinationCity} in India. Consider fuel, toll, and rider time. Return only a number.`,
      }],
      max_tokens: 20,
    });
    const text = response.choices[0]?.message.content?.trim() || '2500';
    const amount = parseInt(text.replace(/[^0-9]/g, ''));
    return isNaN(amount) ? 2500 : amount;
  } catch {
    return 2500;
  }
}

export async function detectFraudSignals(userId: string, profile: IRiderProfile): Promise<string[]> {
  const signals: string[] = [];

  if (profile.cancellationRate > 30) signals.push('High cancellation rate');
  if (profile.verificationStatus !== 'approved') signals.push('Not KYC verified');
  if (profile.completedTrips === 0 && profile.rating > 4.8) signals.push('Suspicious rating without trips');

  return signals;
}

export async function generateTripPartnerRecommendations(
  userCity: string,
  userInterests: string[],
): Promise<{ startCity: string; destination: string; reason: string }[]> {
  return [
    { startCity: userCity, destination: 'Goa', reason: 'Popular coastal route with active biker community' },
    { startCity: userCity, destination: 'Ladakh', reason: 'Legendary Himalayan expedition route' },
    { startCity: userCity, destination: 'Coorg', reason: 'Scenic hill station perfect for weekend trips' },
  ];
}
