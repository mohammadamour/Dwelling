import { PrismaClient, PropertyType, PriceType, PropertyStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { seedPropertyReviews } from './factories/reviewFactory';
import { generatePropertyDescription } from './factories/propertyDescriptionFactory';

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

const US_CITIES = [
  { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { city: 'Atlanta', state: 'GA', lat: 33.4484, lng: -84.3917 },
];

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200',
  'https://images.unsplash.com/photo-1600566753086-00f18fe6ba66?w=1200',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200',
  'https://images.unsplash.com/photo-1600047509358-9dc75571f199?w=1200',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
  'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=1200',
  'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1200',
];

function makeSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getRandomImages(count: number): SeedImage[] {
  const shuffled = [...UNSPLASH_IMAGES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((url, idx) => ({
    url,
    altText: `Property image ${idx + 1}`,
    isPrimary: idx === 0,
  }));
}

function generateProperty(index: number, agentId: string): PropertyInput {
  const cityData = US_CITIES[index % US_CITIES.length];
  const propertyTypes: PropertyType[] = [PropertyType.HOUSE, PropertyType.APT, PropertyType.CONDO, PropertyType.TOWNHOUSE];
  const priceTypes: PriceType[] = [PriceType.SALE, PriceType.RENT];
  const statuses: PropertyStatus[] = [PropertyStatus.AVAILABLE, PropertyStatus.PENDING, PropertyStatus.SOLD];
  
  const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
  const priceType = priceTypes[Math.floor(Math.random() * priceTypes.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const isSale = priceType === PriceType.SALE;
  const basePrice = isSale ? faker.number.int({ min: 150000, max: 1500000 }) : faker.number.int({ min: 800, max: 5000 });
  
  const beds = type === PropertyType.APT && Math.random() > 0.5 ? 0 : faker.number.int({ min: 1, max: 5 });
  const baths = faker.number.int({ min: 1, max: 4 });
  const sqft = faker.number.int({ min: 400, max: 4000 });
  
  const title = faker.helpers.arrayElement([
    `Modern ${type.toLowerCase()} in ${cityData.city}`,
    `${cityData.city} ${type.toLowerCase()} with ${beds} bedrooms`,
    `Stunning ${type.toLowerCase()} in ${cityData.city}`,
    `${beds}BR ${type.toLowerCase()} in ${cityData.city}`,
    `Luxury ${type.toLowerCase()} in ${cityData.city}`,
  ]);

  const builtYear = faker.number.int({ min: 1990, max: 2024 });
  const petFriendly = faker.datatype.boolean();
  const hasParking = faker.datatype.boolean();

  const description = generatePropertyDescription({
    title,
    type,
    city: cityData.city,
    beds,
    baths,
    sqft,
    price: basePrice,
    priceType,
    hasParking,
    petFriendly,
    builtYear,
  });

  return {
    title,
    slug: '',
    description,
    price: basePrice,
    priceType,
    beds,
    baths,
    sqft,
    address: faker.location.streetAddress(),
    city: cityData.city,
    state: cityData.state,
    zip: faker.location.zipCode(),
    lat: cityData.lat + (Math.random() - 0.5) * 0.1,
    lng: cityData.lng + (Math.random() - 0.5) * 0.1,
    type,
    status,
    featured: index < 5,
    builtYear,
    petFriendly,
    hasParking,
    images: getRandomImages(faker.number.int({ min: 2, max: 5 })),
  };
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

  console.log('   • Creating test users with hashed passwords...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.create({
    data: {
      email: 'testuser1@example.com',
      passwordHash,
      name: 'Test User One',
      phone: faker.phone.number(),
      role: Role.SEEKER,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      bio: faker.lorem.sentence(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'testuser2@example.com',
      passwordHash,
      name: 'Test User Two',
      phone: faker.phone.number(),
      role: Role.SEEKER,
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
      bio: faker.lorem.sentence(),
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'testagent@example.com',
      passwordHash,
      name: 'Test Agent',
      phone: faker.phone.number(),
      role: Role.AGENT,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
      bio: 'Experienced real estate agent with a passion for architectural design and seamless client guidance.',
      agentProfile: {
        create: {
          licenseNumber: faker.string.alphanumeric(10),
          yearsExperience: faker.number.int({ min: 5, max: 15 }),
          rating: 4.9,
          agencyName: 'Dwelling Premier Properties',
          totalSales: faker.number.int({ min: 50, max: 200 }),
          specializations: ['Residential', 'Commercial', 'Luxury Homes'],
        },
      },
    },
  });

  console.log('   • Creating curated real estate agents with verified profile headshots...');
  const CURATED_AGENTS = [
    {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@dwelling.com',
      phone: '+1 (555) 234-5678',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      bio: 'Top-producing residential specialist with 12+ years guiding clients through competitive urban markets.',
      agencyName: 'Vanguard Realty Group',
      yearsExperience: 12,
      rating: 4.9,
      totalSales: 148,
      specializations: ['Luxury Homes', 'Residential', 'Relocation'],
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.vance@dwelling.com',
      phone: '+1 (555) 345-6789',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      bio: 'Dedicated urban condo and townhouse expert focused on modern architecture and transit-friendly neighborhoods.',
      agencyName: 'Metropolitan Real Estate',
      yearsExperience: 8,
      rating: 4.8,
      totalSales: 92,
      specializations: ['Condos', 'Townhouses', 'First-Time Buyers'],
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@dwelling.com',
      phone: '+1 (555) 456-7890',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      bio: 'Luxury estate advisor specializing in waterfront villas, historic restorations, and architectural marvels.',
      agencyName: 'Premier Sotheby International',
      yearsExperience: 15,
      rating: 5.0,
      totalSales: 210,
      specializations: ['Luxury Estates', 'Waterfront', 'Historic Homes'],
    },
    {
      name: 'David Chen',
      email: 'david.chen@dwelling.com',
      phone: '+1 (555) 567-8901',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      bio: 'Analytical property advisor combining market trend expertise with client-first negotiation strategies.',
      agencyName: 'Compass Horizon Realty',
      yearsExperience: 6,
      rating: 4.7,
      totalSales: 64,
      specializations: ['Investment', 'Multi-Family', 'Residential'],
    },
    {
      name: 'Amara Okafor',
      email: 'amara.okafor@dwelling.com',
      phone: '+1 (555) 678-9012',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'Passionate neighborhood advocate helping families discover quiet, community-centric suburban living.',
      agencyName: 'Oak & Stone Properties',
      yearsExperience: 9,
      rating: 4.9,
      totalSales: 115,
      specializations: ['Suburban Homes', 'Family Estates', 'New Construction'],
    },
    {
      name: 'Julian Montgomery',
      email: 'julian.montgomery@dwelling.com',
      phone: '+1 (555) 789-0123',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      bio: 'Commercial and luxury residential broker known for seamless transactions and discreet representation.',
      agencyName: 'Beacon Hill Partners',
      yearsExperience: 14,
      rating: 4.8,
      totalSales: 178,
      specializations: ['Commercial', 'Luxury Homes', 'Penthouse'],
    },
    {
      name: 'Chloe Dubois',
      email: 'chloe.dubois@dwelling.com',
      phone: '+1 (555) 890-1234',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      bio: 'Boutique real estate consultant with an eye for interior design, staging, and modern architectural potential.',
      agencyName: 'Atelier Living Realty',
      yearsExperience: 7,
      rating: 4.9,
      totalSales: 83,
      specializations: ['Lofts', 'Design-Forward Homes', 'Rentals'],
    },
    {
      name: 'Robert Sterling',
      email: 'robert.sterling@dwelling.com',
      phone: '+1 (555) 901-2345',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
      bio: 'Experienced relocation consultant and veteran broker committed to transparent, stress-free home transitions.',
      agencyName: 'Sterling Heritage Realty',
      yearsExperience: 18,
      rating: 4.9,
      totalSales: 260,
      specializations: ['Relocation', 'Single Family', 'Investment'],
    },
  ];

  const agentPassword = await bcrypt.hash('agent123', 10);
  const createdAgents = [];
  for (const agentData of CURATED_AGENTS) {
    const agentUser = await prisma.user.create({
      data: {
        email: agentData.email,
        passwordHash: agentPassword,
        name: agentData.name,
        phone: agentData.phone,
        role: Role.AGENT,
        avatarUrl: agentData.avatarUrl,
        bio: agentData.bio,
        agentProfile: {
          create: {
            licenseNumber: faker.string.alphanumeric(10).toUpperCase(),
            yearsExperience: agentData.yearsExperience,
            rating: agentData.rating,
            agencyName: agentData.agencyName,
            totalSales: agentData.totalSales,
            specializations: agentData.specializations,
          },
        },
      },
    });
    createdAgents.push(agentUser);
  }

  const agents = [user3, ...createdAgents];

  console.log('   • Generating 18 properties with varied data...');
  const properties: PropertyInput[] = [];
  for (let i = 0; i < 18; i++) {
    const agentId = agents[i % agents.length].id;
    const property = generateProperty(i, agentId);
    properties.push(property);
  }

  properties.forEach((p) => {
    p.slug = makeSlug(p.title);
  });

  console.log('   • Inserting properties with images...');
  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const agentId = agents[i % agents.length].id;
    
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

  console.log('   • Adding sample favorites...');
  const allProps = await prisma.property.findMany({ take: 5 });
  
  if (allProps[0]) {
    await prisma.favorite.create({ data: { userId: user1.id, propertyId: allProps[0].id } });
  }
  if (allProps[1]) {
    await prisma.favorite.create({ data: { userId: user1.id, propertyId: allProps[1].id } });
  }
  if (allProps[2]) {
    await prisma.favorite.create({ data: { userId: user2.id, propertyId: allProps[2].id } });
  }

  // Seed 2 to 5 realistic reviews per property using the Review Factory
  await seedPropertyReviews(prisma);

  await prisma.newsletterSubscriber.createMany({
    data: Array.from({ length: 5 }, () => ({
      email: faker.internet.email(),
      sourcePage: faker.helpers.arrayElement(['home', 'about', 'properties']),
    })),
  });

  console.log('\n✅ Seed complete!');
  console.log(`   Test Users: 3 (password: password123)`);
  console.log(`   Agents: ${agents.length + 1}`);
  console.log(`   Properties: ${properties.length}`);
  console.log(`   Featured: ${properties.filter(p => p.featured).length}`);
  console.log(`   Cities: ${[...new Set(properties.map(p => p.city))].join(', ')}`);
  if (allProps[0]) {
    console.log(`   Sample property: /api/properties/${allProps[0].id}`);
  }
  console.log('   Stats endpoint:  /api/properties/stats');
  console.log('\n📝 Test Credentials:');
  console.log('   User: testuser1@example.com / password123');
  console.log('   User: testuser2@example.com / password123');
  console.log('   Agent: testagent@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
