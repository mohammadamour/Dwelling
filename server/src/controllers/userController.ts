import { Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const VALID_ROLES: Role[] = [Role.SEEKER, Role.AGENT, Role.ADMIN];

/**
 * GET /api/users/me
 * Fetch the profile of the currently authenticated user
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const prisma = (req as any).prisma as PrismaClient;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        agentProfile: {
          select: {
            licenseNumber: true,
            yearsExperience: true,
            rating: true,
            agencyName: true,
            totalSales: true,
            specializations: true
          }
        },
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      data: user,
      user,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

/**
 * PUT /api/users/me
 * Update personal profile information.
 * Explicitly rejects any attempt to elevate or alter user roles.
 */
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Explicitly reject any client-supplied role or isAdmin modifications
    if ('role' in req.body || 'isAdmin' in req.body) {
      return res.status(403).json({
        error: 'Forbidden: Account roles cannot be modified through profile updates.'
      });
    }

    const { name, email, phone, avatarUrl, bio } = req.body || {};
    const prisma = (req as any).prisma as PrismaClient;

    // Validation
    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email format is required' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if email is already taken by another user
      if (normalizedEmail !== req.user.email.toLowerCase()) {
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(409).json({ error: 'This email is already in use by another account' });
        }
      }
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }

    if (phone !== undefined && phone !== null && typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone must be a string' });
    }

    if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
      return res.status(400).json({ error: 'Avatar URL must be a string' });
    }

    if (bio !== undefined && bio !== null && typeof bio !== 'string') {
      return res.status(400).json({ error: 'Bio must be a string' });
    }

    // Build update object containing strictly allowed fields
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl ? avatarUrl.trim() : null;
    if (bio !== undefined) updateData.bio = bio ? bio.trim() : null;

    // Execute user update
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        agentProfile: {
          select: {
            licenseNumber: true,
            yearsExperience: true,
            rating: true,
            agencyName: true,
            totalSales: true,
            specializations: true
          }
        },
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      }
    });

    res.status(200).json({
      data: updatedUser,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
};

/**
 * PATCH /api/users/:id/role
 * Administrative role assignment endpoint.
 * Strictly restricted to authenticated ADMIN users.
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Administrative privileges required' });
    }

    const targetUserId = req.params.id;
    const { role: newRole } = req.body || {};

    if (!targetUserId || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (!newRole || !VALID_ROLES.includes(newRole)) {
      return res.status(400).json({
        error: `Invalid role specified. Allowed values: ${VALID_ROLES.join(', ')}`
      });
    }

    const prisma = (req as any).prisma as PrismaClient;

    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Guard: Prevent an admin from accidentally stripping their own admin status
    if (existingUser.id === req.user.id && newRole !== 'ADMIN') {
      return res.status(400).json({
        error: 'Cannot remove your own administrative privileges.'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      message: `User role successfully changed to ${newRole}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};
