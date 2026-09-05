import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

/**
 * POST /api/favorites/:propertyId/toggle
 * Toggle favorite status for a property
 */
export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required to save favorites' });
    }

    const propertyId = getParam(req.params.propertyId);
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: req.user.id,
          propertyId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });

      const totalCount = await prisma.favorite.count({
        where: { propertyId },
      });

      return res.status(200).json({
        isFavorite: false,
        message: 'Removed from favorites',
        favoritesCount: totalCount,
      });
    } else {
      await prisma.favorite.create({
        data: {
          userId: req.user.id,
          propertyId,
        },
      });

      const totalCount = await prisma.favorite.count({
        where: { propertyId },
      });

      return res.status(201).json({
        isFavorite: true,
        message: 'Added to favorites',
        favoritesCount: totalCount,
      });
    }
  } catch (error: any) {
    console.error('Toggle favorite error:', error);
    if (error?.code === 'P2003') {
      return res.status(401).json({
        error: 'User account or property no longer exists. Please log in again.',
      });
    }
    res.status(500).json({ error: 'Failed to update favorite status' });
  }
};

/**
 * POST /api/favorites/:propertyId
 * Explicitly add a property to favorites
 */
export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required to save favorites' });
    }

    const propertyId = getParam(req.params.propertyId);
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_propertyId: {
          userId: req.user.id,
          propertyId,
        },
      },
      create: {
        userId: req.user.id,
        propertyId,
      },
      update: {},
    });

    const totalCount = await prisma.favorite.count({
      where: { propertyId },
    });

    res.status(200).json({
      data: favorite,
      isFavorite: true,
      favoritesCount: totalCount,
      message: 'Property added to favorites',
    });
  } catch (error: any) {
    console.error('Add favorite error:', error);
    if (error?.code === 'P2003') {
      return res.status(401).json({
        error: 'User account or property no longer exists. Please log in again.',
      });
    }
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

/**
 * DELETE /api/favorites/:propertyId
 * Remove a property from favorites
 */
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required to manage favorites' });
    }

    const propertyId = getParam(req.params.propertyId);
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        propertyId,
      },
    });

    const totalCount = await prisma.favorite.count({
      where: { propertyId },
    });

    res.status(200).json({
      isFavorite: false,
      favoritesCount: totalCount,
      message: 'Property removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

/**
 * GET /api/favorites/my
 * Retrieve all properties favorited by current user
 */
export const getMyFavorites = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        property: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            agent: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                phone: true,
                email: true,
              },
            },
            _count: {
              select: {
                favorites: true,
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const properties = favorites.map((f) => ({
      ...f.property,
      isFavorite: true,
      favoritedAt: f.createdAt,
    }));

    res.status(200).json({
      data: properties,
      meta: {
        total: properties.length,
      },
    });
  } catch (error) {
    console.error('Get my favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};
