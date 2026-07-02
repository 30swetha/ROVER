import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { admin, initFirebase } from '../config/firebase';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

initFirebase();

export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  // Firebase OTP is sent client-side; this endpoint just validates the phone format
  // and can be used for server-side rate limiting/logging
  res.json({ message: 'OTP flow initiated via Firebase on client', phone: req.body.phone });
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { phone, firebaseToken, name, role } = req.body;

  try {
    let verified = false;

    if (process.env.NODE_ENV === 'development' && firebaseToken === 'firebase_id_token_here') {
      verified = true;
    } else {
      const decoded = await admin.auth().verifyIdToken(firebaseToken);
      if (decoded.phone_number && decoded.phone_number.endsWith(phone)) {
        verified = true;
      }
    }

    if (!verified) {
      res.status(401).json({ error: 'Phone number verification failed' });
      return;
    }

    let user = await User.findOne({ phone });
    const isNew = !user;

    if (!user) {
      user = await User.create({
        phone,
        name: name || 'ROVER User',
        role: role || 'owner',
      });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, phone: user.phone },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
    );

    res.json({ token, user, isNew });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(401).json({ error: 'Invalid Firebase token' });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.id);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role, phone: user.phone },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
  );
  res.json({ token });
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  await User.findByIdAndUpdate(req.user!.id, { $unset: { fcmToken: 1 } });
  res.json({ message: 'Logged out successfully' });
};

export const completeProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

  const { name, role, city, bio, fcmToken } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { name, role, city, bio, ...(fcmToken && { fcmToken }) },
    { new: true },
  );
  res.json({ user });
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;
  const envEmail = process.env.ADMIN_EMAIL || 'admin@rover.com';
  const envPassword = process.env.ADMIN_PASSWORD || 'adminrover123';

  if (email !== envEmail || password !== envPassword) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  try {
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'ROVER Admin',
        phone: '9999999999',
        email: envEmail,
        role: 'admin',
        verified: true,
        trustScore: 100,
      });
    }

    const token = jwt.sign(
      { id: adminUser._id.toString(), role: adminUser.role, phone: adminUser.phone },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
    );

    res.json({ token, user: adminUser });
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};

