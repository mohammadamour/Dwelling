import { PrismaClient } from '@prisma/client';
import { generatePropertyDescription } from './factories/propertyDescriptionFactory';

const prisma = new PrismaClient();

async function updateDescriptions() {
  console.log('🔄 Starting property description update...');

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      city: true,
      beds: true,
      baths: true,
      sqft: true,
      price: true,
      priceType: true,
      hasParking: true,
      petFriendly: true,
      builtYear: true,
    },
  });

  console.log(`📋 Found ${properties.length} properties to update with realistic descriptions.`);

  let updatedCount = 0;
  for (const prop of properties) {
    const realisticDescription = generatePropertyDescription({
      title: prop.title,
      type: prop.type,
      city: prop.city,
      beds: prop.beds,
      baths: prop.baths,
      sqft: prop.sqft,
      price: prop.price,
      priceType: prop.priceType,
      hasParking: prop.hasParking,
      petFriendly: prop.petFriendly,
      builtYear: prop.builtYear ?? undefined,
    });

    await prisma.property.update({
      where: { id: prop.id },
      data: { description: realisticDescription },
    });

    updatedCount++;
    console.log(`   [${updatedCount}/${properties.length}] Updated "${prop.title}" (${prop.city})`);
  }

  console.log(`✨ Successfully updated ${updatedCount} properties with authentic real-estate descriptions!`);
}

updateDescriptions()
  .catch((e) => {
    console.error('❌ Failed to update property descriptions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
