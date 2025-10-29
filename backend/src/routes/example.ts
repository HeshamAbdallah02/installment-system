import { Router, Request, Response } from 'express';

const router = Router();

router.get('/example', (_req: Request, res: Response) => {
  res.json({
    message: 'example endpoint',
  });
});

export default router;
