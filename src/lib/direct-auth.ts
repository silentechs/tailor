import type { Region } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import prisma from './prisma';

// Cookie configuration
const SESSION_COOKIE_NAME = 'sc_session';
const SESSION_EXPIRY_DAYS = 7;

// ============================================
// Session Management
// ============================================

export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          businessName: true,
          businessAddress: true,
          region: true,
          city: true,
          profileImage: true,
          bio: true,
          role: true,
          status: true,
          notifyEmail: true,
          notifySms: true,
          showcaseEnabled: true,
          showcaseUsername: true,
          createdAt: true,
          memberships: {
            select: {
              id: true,
              role: true,
              permissions: true,
              organization: {
                select: { id: true, name: true, slug: true }
              }
            }
          },
          ownedOrganizations: {
            select: { id: true, name: true, slug: true }
          },
          linkedClientId: true,
          linkedClient: {
            select: { id: true, name: true }
          },
        },
      },
    },
  });

  if (!session) return null;

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export async function destroyAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

// ============================================
// Password Management
// ============================================

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================
// Authentication Helpers
// ============================================

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Check user status
  if (user.status === 'PENDING') {
    return { success: false, error: 'Your account is pending approval' };
  }

  if (user.status === 'SUSPENDED') {
    return { success: false, error: 'Your account has been suspended' };
  }

  if (user.status === 'REJECTED') {
    return { success: false, error: 'Your account application was rejected' };
  }

  return { success: true, user };
}

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  businessName?: string;
  role: 'TAILOR' | 'SEAMSTRESS' | 'CLIENT';
  region?: string;
  city?: string;
  trackingToken?: string;
}) {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }

  // Handle client linkage if token provided
  let linkedClientId: string | undefined;
  if (data.role === 'CLIENT' && data.trackingToken) {
    const tracking = await prisma.clientTrackingToken.findUnique({
      where: { token: data.trackingToken },
      include: {
        client: {
          include: { user: { select: { id: true } } }
        }
      }
    });

    if (!tracking || !tracking.isActive) {
      return { success: false, error: 'Invalid or expired tracking token' };
    }

    if (tracking.client.user) {
      return { success: false, error: 'This client record is already linked to an account' };
    }

    linkedClientId = tracking.clientId;
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      role: data.role as any,
      status: 'ACTIVE',
      linkedClientId,
    },
  });


  return { success: true, user };
}

// ============================================
// Role-based Access Control
// ============================================

export function isAdmin(role: string): boolean {
  return role === 'ADMIN';
}

export function isTailor(role: string): boolean {
  return role === 'TAILOR' || role === 'SEAMSTRESS';
}

export function canAccessDashboard(role: string, status: string): boolean {
  return (role === 'TAILOR' || role === 'SEAMSTRESS') && status === 'ACTIVE';
}

export function canAccessAdmin(role: string): boolean {
  return role === 'ADMIN';
}
