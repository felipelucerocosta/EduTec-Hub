// types/express-session.d.ts
import { SessionData } from 'express-session';

declare global {
  namespace Express {
    interface Request {
      session: SessionData;
    }
  }
}
