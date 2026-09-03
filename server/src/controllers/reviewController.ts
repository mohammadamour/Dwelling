import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

/**
 * POST /api/properties/:id/reviews
 * Submit a rating and review for a property listing
 */
export const createPropertyReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required to submit a review' });
    }

    const propertyId = getParam(req.params.id);
    const { rating, comment } = req.body || {};

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars' });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ error: 'A written review comment is required' });
    }

    const prisma = (req as any).prisma as PrismaClient;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const review = await prisma.review.create({
      data: {
        propertyId,
        reviewerId: req.user.id,
        rating: parsedRating,
        comment: comment.trim(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      data: review,
      message: 'Thank you! Your review has been published.',
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

/**
 * GET /api/properties/:id/reviews
 * Fetch all reviews for a property
 */
export const getPropertyReviews = async (req: Request, res: Response) => {
  try {
    const propertyId = getParam(req.params.id);

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    const prisma = (req as any).prisma as PrismaClient;

    const reviews = await prisma.review.findMany({
      where: { propertyId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      data: reviews,
      meta: {
        total: reviews.length,
        averageRating: Number(averageRating.toFixed(1)),
      },
    });
  } catch (error) {
    console.error('Get property reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch property reviews' });
  }
};
