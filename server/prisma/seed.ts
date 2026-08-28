import { PrismaClient, PropertyType, PriceType, PropertyStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

type SeedImage = { url: string; altText: string; isPrimary?: boolean };

type PropertyInput = {
  title: string;
  slug: string;
  description: string;
  price: number;
  priceType: PriceType;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  type: PropertyType;
  status: PropertyStatus;
  featured: boolean;
  builtYear: number;
  petFriendly: boolean;
  hasParking: boolean;
  images: SeedImage[];
};

const IMAGES: Record<string, SeedImage[]> = {
  property1: [
    { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200', altText: 'Gulshan Duplex House exterior with green front lawn', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200', altText: 'Modern living room interior' },
    { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', altText: 'Kitchen with island and stainless steel appliances' },
  ],
  property2: [
    { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200', altText: 'Banani Highrise Loft — modern apartment building facade', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', altText: 'Open-concept loft living area' },
    { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', altText: 'Loft bedroom with city view' },
  ],
  property3: [
    { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200', altText: 'Dhanmondi Terrace Home — rooftop terrace with skyline view', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', altText: 'Terrace home exterior at sunset' },
    { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', altText: 'Outdoor seating area on rooftop' },
  ],
  property4: [
    { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200', altText: 'Uttara Modern Townhouse — suburban family home', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1600566753086-00f18fe6ba66?w=1200', altText: 'Family room with fireplace' },
  ],
  property5: [
    { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200', altText: 'Bashundhara Luxury Condo — highrise with pool', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200', altText: 'Condo balcony with panoramic view' },
  ],
  property6: [
    { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200', altText: 'Mirpur Cozy Studio — compact urban apartment', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200', altText: 'Studio interior with murphy bed' },
  ],
  property7: [
    { url: 'https://images.unsplash.com/photo-1600047509358-9dc75571f199?w=1200', altText: 'Baridhara Executive Villa — premium estate', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200', altText: 'Villa backyard with swimming pool' },
  ],
  property8: [
    { url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200', altText: 'Mohammadpur Garden House — charming bungalow', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200', altText: 'Bungalow garden with patio' },
  ],
  property9: [
    { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200', altText: 'Motijheel Business Loft — live/work apartment', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200', altText: 'Home office area in loft' },
  ],
};

function makeSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('Seeding Dwelling database...');

  console.log('   • Clearing existing records...');
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.tourBooking.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.agentProfile.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.user.deleteMany();

  console.log('   • Creating agents & users...');
  const [agent1, agent2, agent3, agent4, seeker1, seeker2, seeker3] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'david.warner@dwelling.com',
        passwordHash: '$2b$10$placeholderHash1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        name: 'David Warner',
        phone: '+880 1711-000001',
        role: Role.AGENT,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        bio: 'Top-performing agent with 12 years of experience in Dhaka luxury real estate. Specializing in Gulshan, Banani, and Baridhara.',
        agentProfile: {
          create: {
            licenseNumber: 'REB-DA-2011-0042',
            yearsExperience: 12,
            rating: 4.9,
            agencyName: 'Dwelling Premier Realty',
            totalSales: 187,
            specializations: ['Luxury Homes', 'Commercial', 'Investment'],
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah.ahmed@dwelling.com',
        passwordHash: '$2b$10$placeholderHash2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        name: 'Sarah Ahmed',
        phone: '+880 1711-000002',
        role: Role.AGENT,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        bio: 'Family homes specialist. Passionate about helping growing families find their perfect neighborhood.',
        agentProfile: {
          create: {
            licenseNumber: 'REB-DA-2015-0198',
            yearsExperience: 8,
            rating: 4.8,
            agencyName: 'Dwelling Premier Realty',
            totalSales: 112,
            specializations: ['Family Homes', 'First-Time Buyers'],
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'rajib.hasan@dwelling.com',
        passwordHash: '$2b$10$placeholderHash3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        name: 'Rajib Hasan',
        phone: '+880 1711-000003',
        role: Role.AGENT,
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        bio: 'Apartment & condo expert serving Uttara, Mirpur, and Mohammadpur. Great negotiator.',
        agentProfile: {
          create: {
            licenseNumber: 'REB-DA-2018-0356',
            yearsExperience: 5,
            rating: 4.7,
            agencyName: 'City Living Properties',
            totalSales: 64,
            specializations: ['Condos', 'Rentals', 'Investments'],
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'tania.rahman@dwelling.com',
        passwordHash: '$2b$10$placeholderHash4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        name: 'Tania Rahman',
        phone: '+880 1711-000004',
        role: Role.AGENT,
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        bio: 'Luxury villa & high-rise specialist. Bashundhara & Baridhara go-to agent.',
        agentProfile: {
          create: {
            licenseNumber: 'REB-DA-2013-0076',
            yearsExperience: 10,
            rating: 4.95,
            agencyName: 'Elite Estates',
            totalSales: 143,
            specializations: ['Luxury', 'Villas', 'High-Rise'],
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'joe.root@example.com',
        passwordHash: '$2b$10$placeholderHash5xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        name: 'Joe Root',
        phone: '+880 1911-000101',
        role: Role.SEEKER,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        bio: 'UI/UX designer, looking for a cozy 2-bed in Banani.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'fatima.k@example.com',
        passwordHash: '$2b$10$placeholderHash6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        name: 'Fatima Karim',
        phone: '+880 1911-000102',
        role: Role.SEEKER,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        bio: 'Young professional, relocating to Dhaka.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@dwelling.com',
        passwordHash: '$2b$10$placeholderHash7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        name: 'Platform Admin',
        role: Role.ADMIN,
      },
    }),
  ]);

  const agents = [agent1, agent2, agent3, agent4];

  const properties: PropertyInput[] = [
    {
      title: 'Gulshan Duplex House',
      slug: '',
      description: 'A stunning 4-bedroom duplex in the heart of Gulshan. Featuring a lush green lawn, spacious living areas with natural light, modern kitchen with premium fixtures, and a private rooftop terrace. Perfect for families seeking comfort and elegance in one of Dhaka\'s most prestigious neighborhoods.',
      price: 49143,
      priceType: PriceType.SALE,
      beds: 4,
      baths: 3,
      sqft: 2200,
      address: 'House 23, Road 11, Gulshan 2',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zip: '1212',
      lat: 23.796,
      lng: 90.415,
      type: PropertyType.HOUSE,
      status: PropertyStatus.AVAILABLE,
      featured: true,
      builtYear: 2018,
      petFriendly: true,
      hasParking: true,
      images: IMAGES.property1,
    },
    {
      title: 'Banani Highrise Loft',
      slug: '',
      description: 'Modern 2-bedroom loft apartment in a premium Banani high-rise. Floor-to-ceiling windows, polished concrete floors, open-concept kitchen, and stunning skyline views. Walking distance to cafes, co-working spaces, and entertainment.',
      price: 32800,
      priceType: PriceType.SALE,
      beds: 2,
      baths: 2,
      sqft: 1450,
      address: 'Road 17, Block E, Banani',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zip: '1213',
      lat: 23.794,
      lng: 90.404,
      type: PropertyType.APT,
      status: PropertyStatus.AVAILABLE,
      featured: true,
      builtYear: 2021,
      petFriendly: false,
      hasParking: true,
      images: IMAGES.property2,
    },
    {
      title: 'Dhanmondi Terrace Home',
      slug: '',
      description: 'Expansive 5-bed terrace home with breathtaking rooftop views. Private garden, multiple living areas, chef\'s kitchen, and direct access to Dhanmondi Lake. A rare gem combining urban convenience with resort-style living.',
      price: 61250,
      priceType: PriceType.SALE,
      beds: 5,
      baths: 4,
      sqft: 3100,
      address: 'Road 5A, Dhanmondi R/A',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zip: '1205',
      lat: 23.75,
      lng: 90.375,
      type: PropertyType.HOUSE,
      status: PropertyStatus.AVAILABLE,
      featured: true,
      builtYear: 2015,
      petFriendly: true,
      hasParking: true,
      images: IMAGES.property3,
    },
    {
      title: 'Uttara Modern Townhouse',
      slug: '',
      description: 'Beautiful 3-bed townhouse in a quiet Uttara sector. Community playground, 24/7 security, backup generator, and dedicated parking. Close to schools, hospitals, and the airport.',
      price: 1850,
      priceType: PriceType.RENT,
      beds: 3,
      baths: 2,
      sqft: 1800,
      address: 'Sector 10, Uttara',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zip: '1230',
      lat: 23.875,
      lng: 90.379,
      type: PropertyType.TOWNHOUSE,
      status: PropertyStatus.AVAILABLE,
      featured: false,
      builtYear: 2019,
      petFriendly: true,
      hasParking: true,
      images: IMAGES.property4,
    },
    {
      title: 'Bashundhara Luxury Condo',
      slug: '',
      description: 'Prestigious 4-bed condo in Bashundhara R/A. Rooftop infinity pool, state-of-the-art gym, function hall, and 24/7 concierge. Panoramic windows frame the city skyline.',
      price: 4200,
      priceType: PriceType.RENT,
      beds: 4,
      baths: 3,
      sqft: 2600,
      address: 'Block F, Bashundhara R/A',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zip: '1229',
      lat: 23.818,
      lng: 90.425,
      type: PropertyType.CONDO,
      status: PropertyStatus.AVAILABLE,
      featured: false,
      builtYear: 2022,
      petFriendly: false,
      hasParking: true,
      images: IMAGES.property5,
    },
    {
      title: 'Mirpur Cozy Studio',
      slug: '',
      description: 'Compact and efficient studio apartment, perfect for young professionals. Fully furnished, high-speed internet ready, shared rooftop lounge. Steps from Mirpur DOHS and the metro station.',
      price: 650,
      priceType: PriceType.RENT,
      beds: 0,
      baths: 1,
      sqft: 450,
      address: 'Mirpur DOHS, Avenue 3',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zip: '1216',
      lat: 23.825,
      lng: 90.365,
      type: PropertyType.APT,
      status: PropertyStatus.AVAILABLE,
      featured: false,
      builtYear: 2020,
      petFriendly: false,
      hasParking: false,
      images: IMAGES.property6,
    },
    {
      title: 'Baridhara Executive Villa',
      slug: '',
      description: 'Ultra-premium 6-bed executive villa in Baridhara Diplomatic Zone. Private pool, 8-car garage, home theater, wine cellar, and beautifully landscaped 10,000 sqft garden. Security worthy of a head of state.',
      price: 185000,
      priceType: PriceType.SALE,
      beds: 6,
      baths: 6,
      sqft: 5500,
      address: 'Baridhara Diplomatic Zone',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zip: '1212',
      lat: 23.802,
      lng: 90.421,
      type: PropertyType.HOUSE,
      status: PropertyStatus.AVAILABLE,
      featured: true,
      builtYear: 2017,
      petFriendly: true,
      hasParking: true,
      images: IMAGES.property7,
    },
    {
      title: 'Mohammadpur Garden House',
      slug: '',
      description: 'Charming 3-bed bungalow with a mature flower garden and back patio. Sunlit rooms, hardwood floors, and an original fireplace. Quiet street, friendly neighbors.',
      price: 28900,
      priceType: PriceType.SALE,
      beds: 3,
      baths: 2,
      sqft: 1650,
      address: 'Shyamoli, Mohammadpur',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zip: '1207',
      lat: 23.764,
      lng: 90.36,
      type: PropertyType.HOUSE,
      status: PropertyStatus.AVAILABLE,
      featured: false,
      builtYear: 2008,
      petFriendly: true,
      hasParking: true,
      images: IMAGES.property8,
    },
    {
      title: 'Motijheel Business Loft',
      slug: '',
      description: 'Live/work loft in the heart of Motijheel CBD. Ground-floor retail-ready space with upper-level 1-bed residential. Ideal for entrepreneurs, freelancers, or small boutique firms.',
      price: 1100,
      priceType: PriceType.RENT,
      beds: 1,
      baths: 1,
      sqft: 950,
      address: 'Motijheel Commercial Area',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zip: '1000',
      lat: 23.732,
      lng: 90.418,
      type: PropertyType.APT,
      status: PropertyStatus.AVAILABLE,
      featured: false,
      builtYear: 2012,
      petFriendly: false,
      hasParking: false,
      images: IMAGES.property9,
    },
  ];

  properties.forEach((p) => {
    p.slug = makeSlug(p.title);
  });

  console.log(`   • Inserting ${properties.length} properties with images...`);
  for (let i = 0; i < properties.length; i++) {
    const p = properties[i] as PropertyInput;
    const agentId = (agents[i % agents.length] as { id: string }).id;
    await prisma.property.create({
      data: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        priceType: p.priceType,
        beds: p.beds,
        baths: p.baths,
        sqft: p.sqft,
        address: p.address,
        city: p.city,
        state: p.state,
        zip: p.zip,
        lat: p.lat,
        lng: p.lng,
        type: p.type,
        status: p.status,
        featured: p.featured,
        builtYear: p.builtYear,
        petFriendly: p.petFriendly,
        hasParking: p.hasParking,
        agentId,
        images: {
          create: p.images.map((img, idx) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: idx,
            isPrimary: !!img.isPrimary,
          })),
        },
      },
    });
  }

  console.log('   • Adding favorites, reviews, subscribers...');
  const allProps = await prisma.property.findMany({ take: 5 });
  if (allProps[0]) {
    await prisma.favorite.create({ data: { userId: seeker1.id, propertyId: allProps[0].id } });
  }
  if (allProps[1]) {
    await prisma.favorite.create({ data: { userId: seeker1.id, propertyId: allProps[1].id } });
  }
  if (allProps[2]) {
    await prisma.favorite.create({ data: { userId: seeker2.id, propertyId: allProps[2].id } });
  }

  if (allProps[0]) {
    await prisma.review.create({
      data: {
        propertyId: allProps[0].id,
        reviewerId: seeker1.id,
        rating: 5,
        comment: 'Absolutely gorgeous property. David was incredibly helpful and the listing was 100% accurate. We moved in within 2 weeks!',
      },
    });
  }
  if (allProps[1]) {
    await prisma.review.create({
      data: {
        propertyId: allProps[1].id,
        reviewerId: seeker2.id,
        rating: 4,
        comment: 'Great loft, fantastic views. Minor fixtures issue but Sarah got it sorted within a day.',
      },
    });
  }

  await prisma.newsletterSubscriber.createMany({
    data: [
      { email: 'hello@example.com', sourcePage: 'home' },
      { email: 'test.user@domain.com', sourcePage: 'home' },
      { email: 'subscriber@mail.co', sourcePage: 'about' },
    ],
  });

  console.log('\nSeed complete!');
  console.log(`   Agents: ${agents.length}`);
  console.log(`   Properties: ${properties.length}`);
  if (allProps[0]) {
    console.log(`   Sample property: /api/properties/${allProps[0].id}`);
  }
  console.log('   Stats endpoint:  /api/properties/stats');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
