import { create } from 'zustand';

interface RiderCard {
  profile: {
    _id: string;
    rating: number;
    completedTrips: number;
    verificationStatus: string;
    trustLevel: 'bronze' | 'silver' | 'gold';
    languages: string[];
    ridingExperience: number;
    routeExpertise: string[];
    safetyScore: number;
    insuranceStatus: boolean;
    coverPhoto?: string;
    photos: string[];
    prompts: Array<{ question: string; answer: string }>;
  };
  user: {
    _id: string;
    name: string;
    avatar?: string;
    city?: string;
    trustScore: number;
    badges: string[];
    xp: number;
  };
  matchScore: number;
}

interface RiderState {
  riders: RiderCard[];
  currentIndex: number;
  shortlisted: string[];
  passed: string[];
  isLoading: boolean;
  hasMore: boolean;
  setRiders: (riders: RiderCard[]) => void;
  nextRider: () => void;
  prevRider: () => void;
  shortlistRider: (riderId: string) => void;
  passRider: (riderId: string) => void;
  appendRiders: (riders: RiderCard[]) => void;
  setHasMore: (hasMore: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useRiderStore = create<RiderState>((set) => ({
  riders: [],
  currentIndex: 0,
  shortlisted: [],
  passed: [],
  isLoading: false,
  hasMore: true,

  setRiders: (riders) => set({ riders, currentIndex: 0 }),
  nextRider: () => set(s => ({ currentIndex: Math.min(s.currentIndex + 1, s.riders.length - 1) })),
  prevRider: () => set(s => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),
  shortlistRider: (riderId) => set(s => ({
    shortlisted: [...s.shortlisted, riderId],
    currentIndex: Math.min(s.currentIndex + 1, s.riders.length - 1),
  })),
  passRider: (riderId) => set(s => ({
    passed: [...s.passed, riderId],
    currentIndex: Math.min(s.currentIndex + 1, s.riders.length - 1),
  })),
  appendRiders: (riders) => set(s => ({ riders: [...s.riders, ...riders] })),
  setHasMore: (hasMore) => set({ hasMore }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ riders: [], currentIndex: 0, shortlisted: [], passed: [], hasMore: true }),
}));
