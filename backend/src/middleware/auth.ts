import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    phone: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: UserRole; phone: string };

    const user = await User.findById(decoded.id).select('_id role phone suspended');
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    if (user.suspended) {
      res.status(403).json({ error: 'Account suspended' });
      return;
    }

    req.user = { id: decoded.id, role: user.role, phone: user.phone };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Access denied. Required roles: ${roles.join(', ')}` });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireRider = requireRole('rider', 'admin');
export const requireOwner = requireRole('owner', 'admin');
