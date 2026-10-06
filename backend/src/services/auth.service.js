import bcrypt from 'bcryptjs';
import UserModel from '../models/user.model.js';
import { generateToken } from '../utils/token.utils.js';

export class AuthService {
  /**
   * Register a new candidate account.
   * Public registration ALWAYS enforces role = 'candidate'.
   */
  static async registerCandidate({ full_name, email, date_of_birth = null, mobile_number = null, password }) {
    // 1. Check for duplicate email
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    // 2. Hash password with bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Persist new candidate to database
    const newUser = await UserModel.create({
      full_name,
      email,
      date_of_birth: date_of_birth || null,
      mobile_number: mobile_number || null,
      password_hash,
      role: 'candidate',
      status: 'active',
    });

    // 4. Generate JWT authentication token
    const token = generateToken(newUser);

    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.full_name,
        full_name: newUser.full_name,
        email: newUser.email,
        date_of_birth: newUser.date_of_birth,
        mobile_number: newUser.mobile_number,
        role: newUser.role,
        status: newUser.status,
      },
    };
  }

  /**
   * Authenticate user (Candidate or Admin) with email and password
   */
  static async login({ email, password }) {
    // 1. Look up user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // 2. Verify account status
    if (user.status === 'disabled') {
      const error = new Error('Your account has been deactivated. Please contact portal administrator.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Verify password hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // 4. Issue fresh JWT token
    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.full_name,
        full_name: user.full_name,
        email: user.email,
        date_of_birth: user.date_of_birth,
        mobile_number: user.mobile_number,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
      },
    };
  }

  /**
   * Retrieve currently authenticated user profile
   */
  static async getCurrentUser(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    if (user.status === 'disabled') {
      const error = new Error('Your account has been deactivated.');
      error.statusCode = 403;
      throw error;
    }

    return {
      id: user.id,
      name: user.full_name,
      full_name: user.full_name,
      email: user.email,
      date_of_birth: user.date_of_birth,
      mobile_number: user.mobile_number,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    };
  }
}

export default AuthService;
