import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'agri-pos-secret-key-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
  storeId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; storeId: string };
    req.userId = decoded.userId;
    req.storeId = decoded.storeId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateToken(userId: string, storeId: string): string {
  return jwt.sign({ userId, storeId }, JWT_SECRET, { expiresIn: '30d' });
}

export { JWT_SECRET };
