import { PrismaClient, PropertyType, PriceType, PropertyStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

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

  return {
    title,
    slug: '',
    description: faker.lorem.paragraphs(3),
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
    builtYear: faker.number.int({ min: 1990, max: 2024 }),
    petFriendly: faker.datatype.boolean(),
    hasParking: faker.datatype.boolean(),
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
  
  const [user1, user2, user3] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'testuser1@example.com',
        passwordHash,
        name: 'Test User One',
        phone: faker.phone.number(),
        role: Role.SEEKER,
        avatarUrl: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
        bio: faker.lorem.sentence(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'testuser2@example.com',
        passwordHash,
        name: 'Test User Two',
        phone: faker.phone.number(),
        role: Role.SEEKER,
        avatarUrl: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
        bio: faker.lorem.sentence(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'testagent@example.com',
        passwordHash,
        name: 'Test Agent',
        phone: faker.phone.number(),
        role: Role.AGENT,
        avatarUrl: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
        bio: 'Experienced real estate agent',
        agentProfile: {
          create: {
            licenseNumber: faker.string.alphanumeric(10),
            yearsExperience: faker.number.int({ min: 3, max: 15 }),
            rating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
            agencyName: faker.company.name(),
            totalSales: faker.number.int({ min: 20, max: 200 }),
            specializations: ['Residential', 'Commercial'],
          },
        },
      },
    }),
  ]);

  console.log('   • Creating agents...');
  const agents = await Promise.all(
    Array.from({ length: 4 }, async () => {
      const agentPassword = await bcrypt.hash('agent123', 10);
      return prisma.user.create({
        data: {
          email: faker.internet.email(),
          passwordHash: agentPassword,
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          role: Role.AGENT,
          avatarUrl: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
          bio: faker.lorem.sentence(),
          agentProfile: {
            create: {
              licenseNumber: faker.string.alphanumeric(10),
              yearsExperience: faker.number.int({ min: 2, max: 20 }),
              rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
              agencyName: faker.company.name(),
              totalSales: faker.number.int({ min: 10, max: 300 }),
              specializations: faker.helpers.arrayElements([
                'Luxury Homes',
                'Commercial',
                'Residential',
                'Rentals',
                'Investment',
              ], { min: 1, max: 3 }),
            },
          },
        },
      });
    })
  );

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

  console.log('   • Adding sample favorites and reviews...');
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

  if (allProps[0]) {
    await prisma.review.create({
      data: {
        propertyId: allProps[0].id,
        reviewerId: user1.id,
        rating: faker.number.int({ min: 4, max: 5 }),
        comment: faker.lorem.paragraph(),
      },
    });
  }
  if (allProps[1]) {
    await prisma.review.create({
      data: {
        propertyId: allProps[1].id,
        reviewerId: user2.id,
        rating: faker.number.int({ min: 3, max: 5 }),
        comment: faker.lorem.paragraph(),
      },
    });
  }

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
