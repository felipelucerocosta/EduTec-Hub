declare namespace Express {
  export interface Request {
    file?: any;      // Para upload.single()
    files?: any;     // Para upload.array() / upload.fields()
  }
}
