declare module 'express-session' {
  interface SessionData {
    usuario?: {
      id: number;
      rol?: string;
      [key: string]: any;
    };
  }
}
