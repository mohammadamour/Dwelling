import { Response } from 'express';
import { PrismaClient, PropertyType, PriceType } from '@prisma/client';

interface PropertyQueryParams {
  search?: string;
  q?: string;
  city?: string;
  type?: string;
  propertyType?: string;
  priceType?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  bathrooms?: string;
  baths?: string;
  featured?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
}

export const getProperties = async (req: any, res: Response) => {
  try {
    const prisma = (req as any).prisma as PrismaClient;
    const query = req.query as PropertyQueryParams;

    // Support both 'search' and 'q' for search keywords
    const searchTerm = query.search || query.q;
    const city = query.city;
    const type = query.type || query.propertyType;
    const priceType = query.priceType;
    const minPrice = query.minPrice;
    const maxPrice = query.maxPrice;
    const beds = query.beds;
    const baths = query.bathrooms || query.baths;
    const featured = query.featured;
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(query.limit || '10', 10)), 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search keywords (title, city, address, zip, state)
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      const term = searchTerm.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
        { address: { contains: term, mode: 'insensitive' } },
        { zip: { contains: term, mode: 'insensitive' } },
        { state: { contains: term, mode: 'insensitive' } },
      ];
    }

    // City filter
    if (city && typeof city === 'string' && city.trim()) {
      where.city = { contains: city.trim(), mode: 'insensitive' };
    }

    // Property type filter
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

    // Price type filter
    if (priceType && typeof priceType === 'string') {
      const pt = priceType.toUpperCase() as PriceType;
      if (pt === 'RENT' || pt === 'SALE') where.priceType = pt;
    }

    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // Bedrooms
    if (beds) {
      where.beds = { gte: Number(beds) };
    }

    // Bathrooms
    if (baths) {
      where.baths = { gte: Number(baths) };
    }

    // Featured status
    if (featured !== undefined) {
      where.featured = featured === 'true' || featured === '1';
    }

    // Sorting
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = order;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = order;
    } else if (sortBy === 'featured') {
      orderBy.featured = order;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              agentProfile: {
                select: {
                  rating: true,
                  yearsExperience: true,
                  agencyName: true,
                },
              },
            },
          },
        },
        orderBy,
        take: limit,
        skip,
      }),
      prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: properties,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('GET /api/properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
};

export const getPropertyById = async (req: any, res: Response) => {
  try {
    const prisma = (req as any).prisma as PrismaClient;
    const rawId = req.params.id;
    const id: string = Array.isArray(rawId) ? rawId[0] || '' : rawId || '';

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            bio: true,
            agentProfile: {
              select: {
                licenseNumber: true,
                yearsExperience: true,
                rating: true,
                agencyName: true,
                totalSales: true,
                specializations: true,
              },
            },
          },
        },
        reviews: {
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
        },
        _count: {
          select: {
            favorites: true,
            reviews: true,
            tourBookings: true,
          },
        },
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
};

export const getPropertyStats = async (req: any, res: Response) => {
  try {
    const prisma = (req as any).prisma as PrismaClient;

    const [totalListings, totalAgents, citiesData, avgPrice, featuredCount] = await Promise.all([
      prisma.property.count(),
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.property.findMany({
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.property.aggregate({ _avg: { price: true } }),
      prisma.property.count({ where: { featured: true } }),
    ]);

    res.json({
      totalListings,
      totalAgents,
      totalCities: citiesData.length,
      averagePrice: Math.round(avgPrice._avg.price || 0),
      featuredCount,
      listingsAddedWeekly: Math.max(1, Math.round(totalListings * 0.05)),
      clientSatisfaction: 97.2,
    });
  } catch (error) {
    console.error('GET /api/properties/stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getFeaturedProperties = async (req: any, res: Response) => {
  try {
    const prisma = (req as any).prisma as PrismaClient;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string || '6', 10)), 20);

    const properties = await prisma.property.findMany({
      where: { featured: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        agent: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            agentProfile: {
              select: {
                rating: true,
                yearsExperience: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ data: properties });
  } catch (error) {
    console.error('GET /api/properties/featured error:', error);
    res.status(500).json({ error: 'Failed to fetch featured properties' });
  }
};

export const createProperty = async (req: any, res: Response) => {
  try {
    const prisma = (req as any).prisma as PrismaClient;
    const agentId = req.user?.id;

    if (!agentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      title,
      description,
      price,
      priceType,
      beds,
      baths,
      sqft,
      address,
      city,
      state,
      zip,
      type,
      images,
    } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Description must be a non-empty string' });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }
    if (priceType !== 'RENT' && priceType !== 'SALE') {
      return res.status(400).json({ error: 'PriceType must be RENT or SALE' });
    }
    const numBeds = Number(beds);
    if (isNaN(numBeds) || numBeds < 0) {
      return res.status(400).json({ error: 'Beds must be a non-negative number' });
    }
    const numBaths = Number(baths);
    if (isNaN(numBaths) || numBaths < 0) {
      return res.status(400).json({ error: 'Baths must be a non-negative number' });
    }
    const numSqft = Number(sqft);
    if (isNaN(numSqft) || numSqft <= 0) {
      return res.status(400).json({ error: 'Sqft must be a positive number' });
    }
    if (!address || typeof address !== 'string' || !address.trim()) {
      return res.status(400).json({ error: 'Address must be a non-empty string' });
    }
    if (!city || typeof city !== 'string' || !city.trim()) {
      return res.status(400).json({ error: 'City must be a non-empty string' });
    }
    if (!state || typeof state !== 'string' || !state.trim()) {
      return res.status(400).json({ error: 'State must be a non-empty string' });
    }
    if (!zip || typeof zip !== 'string' || !zip.trim()) {
      return res.status(400).json({ error: 'Zip must be a non-empty string' });
    }
    const validTypes = ['HOUSE', 'APT', 'CONDO', 'TOWNHOUSE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Type must be HOUSE, APT, CONDO, or TOWNHOUSE' });
    }

    // Generate unique slug
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${cleanTitle}-${randomSuffix}`;

    // Handle images
    const imageList = Array.isArray(images) ? images.filter((img: any) => typeof img === 'string' && img.trim()) : [];
    const propertyImages = imageList.map((url: string, idx: number) => ({
      url: url.trim(),
      altText: `${title} - Image ${idx + 1}`,
      sortOrder: idx,
      isPrimary: idx === 0,
    }));

    // Create property
    const newProperty = await prisma.property.create({
      data: {
        title: title.trim(),
        slug,
        description: description.trim(),
        price: numPrice,
        priceType,
        beds: numBeds,
        baths: numBaths,
        sqft: numSqft,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        type: type as any,
        agentId,
        images: {
          create: propertyImages,
        },
      },
      include: {
        images: true,
      },
    });

    res.status(201).json({ data: newProperty });
  } catch (error) {
    console.error('POST /api/properties error:', error);
    res.status(500).json({ error: 'Failed to create property listing' });
  }
};

/**
 * TODO: [Tour Booking System] - Planned implementation for scheduling in-person or virtual property tours
 * POST /api/properties/:id/tours
 */
export const bookPropertyTour = async (req: any, res: Response) => {
  try {
    const propertyId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to schedule a tour' });
    }

    res.status(501).json({
      message: 'Tour booking system is planned and currently under active development.',
      propertyId,
      userId,
    });
  } catch (error) {
    console.error('Tour booking stub error:', error);
    res.status(500).json({ error: 'Failed to process tour booking' });
  }
};

/**
 * TODO: [Favorites System] - Planned implementation for toggling saved properties
 * POST /api/properties/:id/favorite
 */
export const togglePropertyFavorite = async (req: any, res: Response) => {
  try {
    const propertyId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to save favorites' });
    }

    res.status(501).json({
      message: 'Favorites persistence system is planned and currently under active development.',
      propertyId,
      userId,
    });
  } catch (error) {
    console.error('Favorite toggle stub error:', error);
    res.status(500).json({ error: 'Failed to process favorite toggle' });
  }
};

/**
 * TODO: [Reviews System] - Planned implementation for submitting property feedback and star ratings
 * POST /api/properties/:id/reviews
 */
export const createPropertyReview = async (req: any, res: Response) => {
  try {
    const propertyId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to submit a review' });
    }

    res.status(501).json({
      message: 'Review authoring system is planned and currently under active development.',
      propertyId,
      userId,
    });
  } catch (error) {
    console.error('Create review stub error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};
