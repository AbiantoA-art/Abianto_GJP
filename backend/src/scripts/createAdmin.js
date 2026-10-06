import bcrypt from 'bcryptjs';
import { env } from '../config/env.config.js';
import UserModel from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import pool from '../config/db.config.js';

/**
 * Administrative Account Provisioning Script
 * Safely seeds an official administrator using environment variables.
 * Prevents duplicate admin creation.
 */
export const createAdminUser = async () => {
  const adminName = env.admin.name || process.env.ADMIN_NAME || 'Portal Administrator';
  const adminEmail = env.admin.email || process.env.ADMIN_EMAIL || 'admin@recruitment.gov.in';
  const adminPassword = env.admin.password || process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required to create an admin account.');
  }

  logger.info(`Checking existing accounts for admin email: ${adminEmail}`);

  const existing = await UserModel.findByEmail(adminEmail);
  if (existing) {
    if (existing.role === 'admin') {
      logger.info(`Admin account with email [${adminEmail}] already exists. No action required.`);
      return { created: false, message: 'Admin account already exists', user: existing };
    } else {
      // Existing user is candidate, elevate to admin
      logger.info(`Account with email [${adminEmail}] found as candidate. Elevating to admin role...`);
      await pool.execute('UPDATE users SET role = ? WHERE id = ?', ['admin', existing.id]);
      logger.info(`User [${adminEmail}] elevated to admin successfully.`);
      return { created: true, message: 'User elevated to admin', user: { ...existing, role: 'admin' } };
    }
  }

  // Hash the admin password with bcrypt
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(adminPassword, saltRounds);

  const newAdmin = await UserModel.create({
    full_name: adminName,
    email: adminEmail,
    mobile_number: '9999999999',
    password_hash,
    role: 'admin',
    status: 'active',
  });

  logger.info(`Official Admin account created successfully for: ${adminName} (${adminEmail})`);
  return { created: true, message: 'Admin created successfully', user: newAdmin };
};

// If run directly: node src/scripts/createAdmin.js
if (process.argv[1] && process.argv[1].endsWith('createAdmin.js')) {
  createAdminUser()
    .then((result) => {
      logger.info('Admin setup script completed:', result.message);
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Failed to create admin user:', err.message);
      process.exit(1);
    });
}
