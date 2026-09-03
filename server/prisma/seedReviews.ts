import { PrismaClient } from '@prisma/client';
import { seedPropertyReviews } from './factories/reviewFactory';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Running standalone Property Reviews Seeder...');
  const result = await seedPropertyReviews(prisma);
  console.log('\n🎉 Property Reviews Seeding Complete:');
  console.log(`   Total Properties Reviewed: ${result.totalProperties}`);
  console.log(`   Total Reviews Created:    ${result.totalReviewsCreated}`);
  console.log(`   Platform Average Rating:  ${result.averageRating} ★`);
}

main()
  .catch((e) => {
    console.error('❌ Review seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
