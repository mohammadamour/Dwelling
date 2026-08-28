import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
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
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, email, phone, avatarUrl, bio } = req.body;

    const prisma = (req as any).prisma as PrismaClient;

    // Validation
    if (email && typeof email !== 'string') {
      return res.status(400).json({ error: 'Email must be a string' });
    }

    if (email && !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (name && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }

    if (phone && typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone must be a string' });
    }

    if (avatarUrl && typeof avatarUrl !== 'string') {
      return res.status(400).json({ error: 'Avatar URL must be a string' });
    }

    if (bio && typeof bio !== 'string') {
      return res.status(400).json({ error: 'Bio must be a string' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email is already taken by another user' });
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;
    if (bio !== undefined) updateData.bio = bio || null;

    // Update user
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
        }
      }
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
};
