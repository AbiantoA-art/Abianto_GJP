import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Ensure JWT_SECRET is defined
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is missing in production environment.');
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'government_job_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_fallback_jwt_secret_phase03_secure_token',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Portal Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@recruitment.gov.in',
    password: process.env.ADMIN_PASSWORD || 'Admin@Portal2026!',
  },
};
