import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();

router.get('/example', (_req: Request, res: Response) => {
  res.json({
    message: 'example endpoint',
  });
});

// Protected endpoint for testing authentication
router.get('/protected', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Access granted to protected endpoint',
    user: req.user,
  });
});

export default router;
