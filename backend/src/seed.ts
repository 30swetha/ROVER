import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from './config/database';
import { User } from './models/User';
import { RiderProfile } from './models/RiderProfile';
import { TransportRequest } from './models/TransportRequest';
import { Trip } from './models/Trip';
import { Post } from './models/Post';
import { Review } from './models/Review';
import mongoose from 'mongoose';

const RIDER_PROMPTS = [
  [
    { question: 'Longest Ride', answer: 'Chennai → Ladakh (4200 km in 12 days)' },
    { question: 'Favorite Motorcycle', answer: 'Royal Enfield Himalayan 450' },
    { question: 'Why Owners Trust Me', answer: '47 successful deliveries with zero incidents' },
    { question: 'Most Memorable Route', answer: 'Manali-Leh Highway during first snowfall' },
  ],
  [
    { question: 'Longest Ride', answer: 'Mumbai → Goa (600 km overnight)' },
    { question: 'Riding Since', answer: '2015 — 9 years of highway riding' },
    { question: 'Why Owners Trust Me', answer: 'Ex-Army dispatch rider. Discipline is my default.' },
    { question: 'Dream Destination', answer: 'Bhutan on a bullet' },
  ],
  [
    { question: 'Longest Ride', answer: 'Bangalore → Rajasthan (2100 km)' },
    { question: 'Favorite Motorcycle', answer: 'KTM 390 Adventure' },
    { question: 'Best Delivery Story', answer: 'Delivered a vintage Bullet to its owner in Jaipur safely' },
    { question: 'Community Role', answer: 'Founder of Deccan Riders Club' },
  ],
];

async function seed() {
  await connectDatabase();
  console.log('🌱 Seeding ROVER database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    RiderProfile.deleteMany({}),
    TransportRequest.deleteMany({}),
    Trip.deleteMany({}),
    Post.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // Create owners
  const owners = await User.insertMany([
    { name: 'Priya Sharma', phone: '9876543210', email: 'priya@rover.com', role: 'owner', city: 'Mumbai', verified: true, trustScore: 82 },
    { name: 'Rahul Mehta', phone: '9876543211', email: 'rahul@rover.com', role: 'owner', city: 'Bangalore', verified: true, trustScore: 75 },
    { name: 'Kavitha Nair', phone: '9876543212', email: 'kavitha@rover.com', role: 'owner', city: 'Chennai', verified: true, trustScore: 68 },
    { name: 'Arjun Singh', phone: '9876543213', email: 'arjun@rover.com', role: 'owner', city: 'Delhi', verified: true, trustScore: 90 },
    { name: 'Sneha Patel', phone: '9876543214', email: 'sneha@rover.com', role: 'owner', city: 'Pune', verified: true, trustScore: 71 },
  ]);

  // Create riders
  const riderUsers = await User.insertMany([
    { name: 'Vikram Rathore', phone: '9876543220', email: 'vikram@rover.com', role: 'rider', city: 'Mumbai', verified: true, trustScore: 94, xp: 4200, badges: ['verified_rider', 'fifty_trips', 'top_rated'] },
    { name: 'Dev Kumar', phone: '9876543221', email: 'dev@rover.com', role: 'rider', city: 'Bangalore', verified: true, trustScore: 88, xp: 3100, badges: ['verified_rider', 'ten_trips'] },
    { name: 'Sanjay Desai', phone: '9876543222', email: 'sanjay@rover.com', role: 'rider', city: 'Pune', verified: true, trustScore: 76, xp: 1800, badges: ['verified_rider', 'first_ride'] },
    { name: 'Karthik Menon', phone: '9876543223', email: 'karthik@rover.com', role: 'rider', city: 'Chennai', verified: true, trustScore: 91, xp: 5500, badges: ['verified_rider', 'hundred_trips', 'five_star_streak'] },
    { name: 'Rohit Yadav', phone: '9876543224', email: 'rohit@rover.com', role: 'rider', city: 'Hyderabad', verified: true, trustScore: 83, xp: 2900, badges: ['verified_rider', 'ten_trips'] },
    { name: 'Aryan Kapoor', phone: '9876543225', email: 'aryan@rover.com', role: 'rider', city: 'Delhi', verified: true, trustScore: 79, xp: 2200, badges: ['verified_rider', 'ten_trips'] },
    { name: 'Suresh Pillai', phone: '9876543226', email: 'suresh@rover.com', role: 'rider', city: 'Kochi', verified: true, trustScore: 86, xp: 3400, badges: ['verified_rider', 'fifty_trips'] },
    { name: 'Naveen Sharma', phone: '9876543227', email: 'naveen@rover.com', role: 'rider', city: 'Jaipur', verified: true, trustScore: 72, xp: 1500, badges: ['verified_rider', 'first_ride'] },
    { name: 'Prakash Rao', phone: '9876543228', email: 'prakash@rover.com', role: 'rider', city: 'Ahmedabad', verified: true, trustScore: 89, xp: 4800, badges: ['verified_rider', 'fifty_trips', 'top_rated'] },
    { name: 'Ankit Verma', phone: '9876543229', email: 'ankit@rover.com', role: 'rider', city: 'Lucknow', verified: true, trustScore: 65, xp: 900, badges: ['verified_rider'] },
  ]);

  // Create rider profiles
  const riderProfiles = [
    { completedTrips: 67, rating: 4.9, ridingExperience: 8, routeExpertise: ['Mumbai-Goa', 'Mumbai-Pune', 'Mumbai-Nashik'], safetyScore: 98, insuranceStatus: true, trustLevel: 'gold', prompts: RIDER_PROMPTS[0], languages: ['Hindi', 'English', 'Marathi'] },
    { completedTrips: 34, rating: 4.7, ridingExperience: 5, routeExpertise: ['Bangalore-Goa', 'Bangalore-Mysore', 'Bangalore-Chennai'], safetyScore: 94, insuranceStatus: true, trustLevel: 'gold', prompts: RIDER_PROMPTS[1], languages: ['Kannada', 'Tamil', 'English'] },
    { completedTrips: 19, rating: 4.4, ridingExperience: 4, routeExpertise: ['Pune-Mumbai', 'Pune-Bangalore'], safetyScore: 89, insuranceStatus: false, trustLevel: 'silver', prompts: RIDER_PROMPTS[2], languages: ['Marathi', 'Hindi'] },
    { completedTrips: 124, rating: 4.95, ridingExperience: 12, routeExpertise: ['Chennai-Bangalore', 'Chennai-Hyderabad', 'Chennai-Mumbai'], safetyScore: 99, insuranceStatus: true, trustLevel: 'gold', prompts: RIDER_PROMPTS[0], languages: ['Tamil', 'Telugu', 'English'] },
    { completedTrips: 41, rating: 4.6, ridingExperience: 6, routeExpertise: ['Hyderabad-Bangalore', 'Hyderabad-Mumbai'], safetyScore: 92, insuranceStatus: true, trustLevel: 'gold', prompts: RIDER_PROMPTS[1], languages: ['Telugu', 'Hindi', 'English'] },
    { completedTrips: 28, rating: 4.5, ridingExperience: 5, routeExpertise: ['Delhi-Jaipur', 'Delhi-Agra', 'Delhi-Chandigarh'], safetyScore: 91, insuranceStatus: true, trustLevel: 'silver', prompts: RIDER_PROMPTS[2], languages: ['Hindi', 'Punjabi', 'English'] },
    { completedTrips: 55, rating: 4.8, ridingExperience: 9, routeExpertise: ['Kochi-Bangalore', 'Kochi-Chennai', 'Kerala-Goa'], safetyScore: 96, insuranceStatus: true, trustLevel: 'gold', prompts: RIDER_PROMPTS[0], languages: ['Malayalam', 'Tamil', 'English'] },
    { completedTrips: 12, rating: 4.2, ridingExperience: 3, routeExpertise: ['Jaipur-Delhi', 'Jaipur-Ajmer'], safetyScore: 85, insuranceStatus: false, trustLevel: 'silver', prompts: RIDER_PROMPTS[1], languages: ['Hindi', 'Rajasthani'] },
    { completedTrips: 78, rating: 4.85, ridingExperience: 10, routeExpertise: ['Ahmedabad-Mumbai', 'Ahmedabad-Rajasthan'], safetyScore: 97, insuranceStatus: true, trustLevel: 'gold', prompts: RIDER_PROMPTS[2], languages: ['Gujarati', 'Hindi', 'English'] },
    { completedTrips: 8, rating: 4.0, ridingExperience: 2, routeExpertise: ['Lucknow-Delhi', 'Lucknow-Varanasi'], safetyScore: 82, insuranceStatus: false, trustLevel: 'bronze', prompts: RIDER_PROMPTS[0], languages: ['Hindi', 'English'] },
  ];

  await RiderProfile.insertMany(
    riderUsers.map((u, i) => ({
      userId: u._id,
      verificationStatus: 'approved',
      ...riderProfiles[i],
    })),
  );

  // Create transport requests
  const requests = await TransportRequest.insertMany([
    {
      ownerId: owners[0]._id,
      pickupCity: 'Mumbai', destinationCity: 'Goa',
      pickupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deliveryDeadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      bikeBrand: 'Royal Enfield', bikeModel: 'Classic 350', registrationNumber: 'MH01AB1234',
      budget: 4500, distance: 592, estimatedDuration: 12,
      notes: 'Please keep the bike covered during any rain',
      status: 'open', applicants: [],
    },
    {
      ownerId: owners[1]._id,
      pickupCity: 'Bangalore', destinationCity: 'Chennai',
      pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveryDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      bikeBrand: 'KTM', bikeModel: 'Duke 390', registrationNumber: 'KA01XY5678',
      budget: 3200, distance: 345, estimatedDuration: 7,
      notes: 'Sport bike, please ride carefully',
      status: 'open', applicants: [],
    },
    {
      ownerId: owners[2]._id,
      pickupCity: 'Delhi', destinationCity: 'Jaipur',
      pickupDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      deliveryDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      bikeBrand: 'Honda', bikeModel: 'CB300R', registrationNumber: 'DL02MN9012',
      budget: 2800, distance: 268, estimatedDuration: 6,
      status: 'open', applicants: [],
    },
    {
      ownerId: owners[3]._id,
      pickupCity: 'Hyderabad', destinationCity: 'Bangalore',
      pickupDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      deliveryDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      bikeBrand: 'Bajaj', bikeModel: 'Dominar 400', registrationNumber: 'TS09PQ3456',
      budget: 3800, distance: 570, estimatedDuration: 11,
      status: 'open', applicants: [],
    },
    {
      ownerId: owners[4]._id,
      pickupCity: 'Pune', destinationCity: 'Mumbai',
      pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      deliveryDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      bikeBrand: 'Yamaha', bikeModel: 'MT-15', registrationNumber: 'MH12ST7890',
      budget: 1800, distance: 153, estimatedDuration: 3,
      status: 'open', applicants: [],
    },
  ]);

  // Create trips
  await Trip.insertMany([
    {
      creatorId: riderUsers[0]._id, title: 'Goa Beach Expedition 2025',
      startCity: 'Mumbai', destination: 'Goa',
      route: ['Mumbai', 'Pune', 'Kolhapur', 'Goa'],
      date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      maxRiders: 10, currentRiders: [riderUsers[0]._id, riderUsers[1]._id],
      description: 'Iconic coastal ride through the Sahyadri mountains. Night stay in Kolhapur. Beach bonfire in Goa!',
      tags: ['goa', 'coastal', 'weekend'], status: 'open',
    },
    {
      creatorId: riderUsers[3]._id, title: 'Ladakh Summer Assault',
      startCity: 'Manali', destination: 'Leh',
      route: ['Manali', 'Rohtang', 'Keylong', 'Sarchu', 'Pang', 'Leh'],
      date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      maxRiders: 8, currentRiders: [riderUsers[3]._id, riderUsers[6]._id, riderUsers[8]._id],
      description: 'The ultimate Himalayan challenge. 490 km of breathtaking altitude riding. Full expedition gear required.',
      tags: ['ladakh', 'himalaya', 'adventure', 'bucket-list'], status: 'open',
    },
    {
      creatorId: riderUsers[6]._id, title: 'Kerala Backwaters Ride',
      startCity: 'Kochi', destination: 'Kovalam',
      route: ['Kochi', 'Alleppey', 'Kollam', 'Trivandrum', 'Kovalam'],
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      maxRiders: 6, currentRiders: [riderUsers[6]._id, riderUsers[4]._id],
      description: 'Peaceful ride through Kerala backwaters, coconut groves, and coastal roads.',
      tags: ['kerala', 'coastal', 'scenic'], status: 'open',
    },
  ]);

  // Create posts
  await Post.insertMany([
    {
      authorId: riderUsers[0]._id, type: 'post',
      content: 'Just completed my 67th delivery! 🏍️ Mumbai to Goa run done in record time. The Sahyadri mountains were absolutely stunning at sunrise. ROVER community is the best! #RideAndEarn #ROVER',
      images: [], tags: ['delivery', 'mumbai', 'goa'],
    },
    {
      authorId: riderUsers[3]._id, type: 'reel',
      content: 'Ladakh 2024 - Magnetic Hill moment! The road literally looks uphill but you roll forward. Wild! 🏔️',
      videos: [], images: [], tags: ['ladakh', 'himalaya', 'magic'],
    },
    {
      authorId: riderUsers[6]._id, type: 'post',
      content: 'Kerala coastline at dawn is something else. Did 320 km today through the most beautiful stretches of NH-66. Stopped at a roadside toddy shop, met fellow bikers, exchanged routes. This is what riding is about! 🌴',
      images: [], tags: ['kerala', 'nh66', 'coastal'],
    },
  ]);

  console.log('✅ Seed complete!');
  console.log(`  👥 ${owners.length} owners`);
  console.log(`  🏍️ ${riderUsers.length} riders`);
  console.log(`  📦 ${requests.length} transport requests`);
  console.log('  🗺️ 3 trips');
  console.log('  📸 3 posts');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
