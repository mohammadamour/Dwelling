import express = require('express');
import type { PrismaClient, PropertyType, PriceType } from '@prisma/client';

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

function getPrisma(req: Request): PrismaClient {
  return (req as any).prisma as PrismaClient;
}

/**
 * GET /api/properties
 * Query params:
 *   - search: string (matches title, city, address, zip)
 *   - type: HOUSE | APT | CONDO | TOWNHOUSE
 *   - priceType: RENT | SALE
 *   - minPrice, maxPrice: number
 *   - beds, baths: number
 *   - featured: boolean
 *   - limit, skip: number (pagination)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const {
      search,
      type,
      priceType,
      minPrice,
      maxPrice,
      beds,
      baths,
      featured,
      limit = '12',
      skip = '0',
    } = req.query;

    const where: any = {};

    // Full-text-ish search
    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
        { address: { contains: term, mode: 'insensitive' } },
        { zip: { contains: term, mode: 'insensitive' } },
        { state: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Property type filter (supports comma-separated or alias like "House"/"Apt")
    if (type && typeof type === 'string') {
      const typeMap: Record<string, PropertyType> = {
        house: 'HOUSE',
        apt: 'APT',
        apartment: 'APT',
        condo: 'CONDO',
        townhouse: 'TOWNHOUSE',
      };
      const normalized = type
        .split(',')
        .map((t) => typeMap[t.trim().toLowerCase()])
        .filter(Boolean);
      if (normalized.length > 0) {
        where.type = { in: normalized as PropertyType[] };
      } else if (Object.values(typeMap).includes(type.toUpperCase() as PropertyType)) {
        where.type = type.toUpperCase() as PropertyType;
      }
    }

    if (priceType && typeof priceType === 'string') {
      const pt = priceType.toUpperCase() as PriceType;
      if (pt === 'RENT' || pt === 'SALE') where.priceType = pt;
    }

    if (minPrice) where.price = { ...(where.price || {}), gte: Number(minPrice) };
    if (maxPrice) where.price = { ...(where.price || {}), lte: Number(maxPrice) };
    if (beds) where.beds = { gte: Number(beds) };
    if (baths) where.baths = { gte: Number(baths) };
    if (featured !== undefined) where.featured = featured === 'true' || featured === '1';

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          agent: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              agentProfile: { select: { rating: true, yearsExperience: true } },
            },
          },
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(Number(limit) || 12, 100),
        skip: Number(skip) || 0,
      }),
      prisma.property.count({ where }),
    ]);

    res.json({
      data: properties,
      meta: {
        total,
        returned: properties.length,
        limit: Number(limit),
        skip: Number(skip),
      },
    });
  } catch (error) {
    console.error('GET /api/properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

/**
 * GET /api/properties/stats
 * Dynamic stats for the landing page
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);

    const [totalListings, totalAgents, citiesData, avgPrice] = await Promise.all([
      prisma.property.count(),
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.property.findMany({
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.property.aggregate({ _avg: { price: true } }),
    ]);

    res.json({
      totalListings,
      totalAgents,
      totalCities: citiesData.length,
      averagePrice: Math.round(avgPrice._avg.price || 0),
      listingsAddedWeekly: Math.max(1, Math.round(totalListings * 0.05)),
      clientSatisfaction: 97.2,
    });
  } catch (error) {
    console.error('GET /api/properties/stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/properties/:id
 * Fetch a single property by ID with full details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const rawId = req.params.id;
    const id: string = Array.isArray(rawId) ? rawId[0] || '' : rawId || '';

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        agent: {
          include: {
            agentProfile: true,
          },
        },
        reviews: {
          include: { reviewer: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { favorites: true, reviews: true, tourBookings: true } },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ data: property });
  } catch (error) {
    console.error('GET /api/properties/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch property details' });
  }
});

export = router;
