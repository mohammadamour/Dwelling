import { Response } from 'express';
import { PrismaClient, TourType, TourStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

const VALID_TOUR_TYPES: TourType[] = [TourType.IN_PERSON, TourType.VIRTUAL];
const VALID_TOUR_STATUSES: TourStatus[] = [
  TourStatus.REQUESTED,
  TourStatus.CONFIRMED,
  TourStatus.COMPLETED,
  TourStatus.CANCELLED,
];

/**
 * POST /api/tours
 * Schedule a new property tour visit
 */
export const createTourBooking = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required to schedule a tour' });
    }

    const { propertyId: rawPropId, tourDate, tourType = 'IN_PERSON', notes } = req.body || {};
    const propertyId = typeof rawPropId === 'string' ? rawPropId : getParam(req.params.id);

    if (!propertyId) {
      return res.status(400).json({ error: 'Valid property ID is required' });
    }

    if (!tourDate) {
      return res.status(400).json({ error: 'Tour date and time are required' });
    }

    const parsedDate = new Date(tourDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid tour date format' });
    }

    if (parsedDate.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Tour date must be scheduled for a future time' });
    }

    const normalizedTourType = String(tourType).toUpperCase() as TourType;
    if (!VALID_TOUR_TYPES.includes(normalizedTourType)) {
      return res.status(400).json({
        error: `Invalid tour type. Must be one of: ${VALID_TOUR_TYPES.join(', ')}`,
      });
    }

    const prisma = (req as any).prisma as PrismaClient;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        city: true,
        price: true,
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const booking = await prisma.tourBooking.create({
      data: {
        propertyId,
        userId: req.user.id,
        tourDate: parsedDate,
        tourType: normalizedTourType,
        status: TourStatus.REQUESTED,
        notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
            agent: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      data: booking,
      message: 'Your property tour has been scheduled successfully. The agent will review and confirm your visit.',
    });
  } catch (error) {
    console.error('Create tour booking error:', error);
    res.status(500).json({ error: 'Failed to schedule tour booking' });
  }
};

/**
 * GET /api/tours/my
 * Retrieve all tour bookings scheduled by the current user
 */
export const getMyTours = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const prisma = (req as any).prisma as PrismaClient;

    const bookings = await prisma.tourBooking.findMany({
      where: { userId: req.user.id },
      include: {
        property: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
            agent: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatarUrl: true,
                agentProfile: {
                  select: {
                    agencyName: true,
                    licenseNumber: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { tourDate: 'desc' },
    });

    res.status(200).json({
      data: bookings,
      meta: {
        total: bookings.length,
      },
    });
  } catch (error) {
    console.error('Get my tours error:', error);
    res.status(500).json({ error: 'Failed to fetch tour bookings' });
  }
};

/**
 * PATCH /api/tours/:id/status
 * Update status of a tour booking (confirm, complete, or cancel)
 */
export const updateTourStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const id = getParam(req.params.id);
    const { status } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const normalizedStatus = String(status).toUpperCase() as TourStatus;
    if (!VALID_TOUR_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_TOUR_STATUSES.join(', ')}`,
      });
    }

    const prisma = (req as any).prisma as PrismaClient;

    const booking = await prisma.tourBooking.findUnique({
      where: { id },
      include: {
        property: {
          select: { agentId: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Tour booking not found' });
    }

    // Permission check: User can only cancel their own booking.
    // Agent of the property or Admin can perform all status transitions.
    const isOwner = booking.userId === req.user.id;
    const isAgent = booking.property && booking.property.agentId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAgent && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this booking' });
    }

    if (isOwner && !isAgent && !isAdmin && normalizedStatus !== TourStatus.CANCELLED) {
      return res.status(403).json({ error: 'Home seekers may only cancel scheduled tours' });
    }

    const updated = await prisma.tourBooking.update({
      where: { id },
      data: { status: normalizedStatus },
    });

    res.status(200).json({
      data: updated,
      message: `Tour booking status updated to ${normalizedStatus}`,
    });
  } catch (error) {
    console.error('Update tour status error:', error);
    res.status(500).json({ error: 'Failed to update tour booking status' });
  }
};
