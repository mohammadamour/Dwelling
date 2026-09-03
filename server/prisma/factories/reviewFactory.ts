import { PrismaClient } from '@prisma/client';

export interface ReviewerIdentity {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ReviewSeedItem {
  propertyId: string;
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

/**
 * Believable positive review templates strictly avoiding lorem ipsum.
 * Covers spacious layout, quiet neighborhoods, natural lighting, fair pricing, and hospitable agents.
 */
const FIVE_STAR_REVIEWS = [
  // Spaciousness & Layout
  "Toured this property over the weekend and was blown away by how spacious the layout feels in person. The open floor plan and high ceilings make every room feel bright, expansive, and welcoming.",
  "Incredible square footage and intelligent design throughout. The primary suite is generous with a fantastic walk-in closet, and the spare rooms are perfectly proportioned for guests or a home office.",
  "The room flow here is exceptional. The main living space transitions smoothly into a chef's kitchen, creating the ideal setup for weekend gatherings and family dinners.",
  "Much larger than it appears from the exterior photos! Every square foot is thoughtfully utilized with abundant built-in storage and roomy closets in each bedroom.",

  // Quiet Neighborhood & Location
  "The location could not be better. It is tucked away in a quiet, tree-lined enclave with virtually zero street noise, yet still within an easy stroll to local cafes, grocery markets, and parks.",
  "Such a tranquil and peaceful setting! We walked the surrounding blocks during both daytime and evening hours; the neighborhood is friendly, exceptionally safe, and serene.",
  "Prime location with a charming neighborhood feel. Having morning coffee on the back patio with total peace and quiet was the absolute highlight of our walkthrough.",
  "Convenient access to city transit and commuter routes while feeling completely insulated from traffic hum. The tree-shaded sidewalks and neighborhood parks are a huge plus.",

  // Natural Lighting & Ambiance
  "The natural lighting in this home is extraordinary! Massive windows let warm sunlight flood the living room and kitchen all morning and afternoon. Truly stunning in person.",
  "Photos honestly do not do the lighting justice. Golden hour in the main living space is breathtaking, and the warm hardwood finishes reflect the sunlight beautifully.",
  "Loved the sunlit breakfast nook and panoramic windows throughout. The entire place feels uplifting, airy, and inviting from the minute you step through the front door.",
  "South-facing exposure provides magnificent daylight all day long. Even on overcast days, the interior feels radiant and open thanks to the high ceilings and clean wall lines.",

  // Reasonable Pricing & Great Value
  "Given the quality of the recent renovations and the prime location, this is easily one of the strongest value propositions currently on the market. Turnkey condition at a very fair price.",
  "Outstanding value for the caliber of finishes. From the custom quartz countertops to the high-efficiency HVAC and designer bathroom tiles, every detail reflects top-tier care.",
  "Very competitive pricing for this tier of real estate. You would be hard-pressed to find another home offering this much usable square footage and refined craftsmanship in this zip code.",

  // Hospitable & Responsive Agent
  "The listing agent was extraordinarily hospitable, patient, and professional throughout our walkthrough. They provided clear disclosures and answered all questions with complete transparency.",
  "Working with the listing agent was an absolute pleasure. They accommodated our busy schedule for a private tour on short notice and provided rich background on the building and HOA.",
  "Remarkable agent service! Prompt communication, welcoming energy, and deep knowledge of recent neighborhood comparables. Made the entire tour enjoyable and effortless.",

  // Turnkey Quality & Modern Amenities
  "Completely turnkey and move-in ready. The kitchen appliances are high-end, the bathrooms feel like a boutique spa, and the smart home climate controls are a wonderful modern touch.",
  "Immaculately maintained from foundation to roofline. The private outdoor patio and dedicated garage parking add everyday luxury and peace of mind.",
  "Attended the open house and immediately put this property at the top of our shortlist. Spotless condition, thoughtful architectural touches, and a warm, inviting atmosphere throughout."
];

const FOUR_STAR_REVIEWS = [
  "Fantastic property with exceptional natural lighting and a spacious open layout. Street parking can get a bit tight during peak evening hours, but the dedicated parking space solves that. Overall, a great home!",
  "Very impressed by the quality of the kitchen remodel and the quiet surroundings. The secondary bedroom is slightly cozier than anticipated, but the primary suite and living area more than make up for it.",
  "A wonderful, bright home in a lovely neighborhood. The backyard patio is peaceful and private. The agent was courteous, knowledgeable, and very responsive throughout our inquiry.",
  "Solid property with great value for the square footage. Located close to public transit and local shops while maintaining a quiet, residential feel. Highly recommend scheduling a walkthrough.",
  "Loved the tall ceilings and modern finishes throughout. Would have loved a slightly larger kitchen pantry, but the overall layout, natural light, and curb appeal are top tier.",
  "Great experience touring this listing. The agent was very accommodating and walked us through utility histories and recent mechanical upgrades. Strong contender in this price bracket.",
  "Bright, clean, and well cared for. The hardwood floors look brand new and the neighborhood is very family-friendly. Definite potential for anyone seeking a low-maintenance home."
];

const THREE_STAR_REVIEWS = [
  "Decent property with good natural light and a pleasant neighborhood vibe. The layout could use minor cosmetic updates in the guest bath, but the bones and price point are solid.",
  "Fair listing for the price. The main living space is comfortable and the agent was friendly during our visit. Storage space is somewhat limited, but suitable for minimalists.",
  "Convenient location near main transit corridors, though there is a bit of ambient traffic hum during morning rush hours. The interior finishes and kitchen appliances are in great shape."
];

/**
 * Generate a realistic review rating reflecting a believable positive distribution:
 * ~65% 5 stars, ~25% 4 stars, ~10% 3 stars.
 */
export function generateReviewRating(): number {
  const roll = Math.random();
  if (roll < 0.65) return 5;
  if (roll < 0.90) return 4;
  return 3;
}

/**
 * Get an authentic review text matching the given rating.
 */
export function getReviewCommentByRating(rating: number, indexOffset = 0): string {
  if (rating === 5) {
    const idx = (indexOffset + Math.floor(Math.random() * FIVE_STAR_REVIEWS.length)) % FIVE_STAR_REVIEWS.length;
    return FIVE_STAR_REVIEWS[idx];
  }
  if (rating === 4) {
    const idx = (indexOffset + Math.floor(Math.random() * FOUR_STAR_REVIEWS.length)) % FOUR_STAR_REVIEWS.length;
    return FOUR_STAR_REVIEWS[idx];
  }
  const idx = (indexOffset + Math.floor(Math.random() * THREE_STAR_REVIEWS.length)) % THREE_STAR_REVIEWS.length;
  return THREE_STAR_REVIEWS[idx];
}

/**
 * Generate a randomized past Date spread between minDays and maxDays ago.
 */
export function generatePastDate(minDays = 3, maxDays = 150): Date {
  const now = Date.now();
  const daysAgo = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  const jitterMs = Math.floor(Math.random() * 86400000);
  return new Date(now - (daysAgo * 86400000 + jitterMs));
}

/**
 * Generate between minReviews and maxReviews for a single property using a pool of eligible reviewers.
 * Ensures no reviewer reviews the same property more than once.
 */
export function generateReviewsForProperty(
  propertyId: string,
  eligibleReviewers: ReviewerIdentity[],
  options: { minReviews?: number; maxReviews?: number; listingAgentId?: string } = {}
): ReviewSeedItem[] {
  const { minReviews = 2, maxReviews = 5, listingAgentId } = options;

  // Filter out the property's own listing agent
  const candidates = listingAgentId
    ? eligibleReviewers.filter((r) => r.id !== listingAgentId)
    : [...eligibleReviewers];

  if (candidates.length === 0) {
    return [];
  }

  // Determine target review count (between minReviews and maxReviews, clamped by available candidates)
  const targetCount = Math.min(
    candidates.length,
    Math.floor(Math.random() * (maxReviews - minReviews + 1)) + minReviews
  );

  // Shuffle candidates and pick targetCount unique reviewers
  const shuffled = [...candidates].sort(() => 0.5 - Math.random());
  const selectedReviewers = shuffled.slice(0, targetCount);

  // Generate review records with natural dates sorted chronologically
  const reviews: ReviewSeedItem[] = selectedReviewers.map((reviewer, idx) => {
    const rating = generateReviewRating();
    const comment = getReviewCommentByRating(rating, idx);
    const createdAt = generatePastDate(3, 160);

    return {
      propertyId,
      reviewerId: reviewer.id,
      rating,
      comment,
      createdAt,
    };
  });

  return reviews;
}

/**
 * Core Seeder Function:
 * Fetches all properties and existing agent reviewers, clears old reviews,
 * and attaches 2 to 5 realistic reviews to every property listing in the database.
 */
export async function seedPropertyReviews(prisma: PrismaClient): Promise<{
  totalProperties: number;
  totalReviewsCreated: number;
  averageRating: number;
  ratingBreakdown: Record<number, number>;
}> {
  console.log('   • Initializing Property Reviews Factory...');

  // 1. Fetch all properties
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      title: true,
      agentId: true,
    },
  });

  if (properties.length === 0) {
    console.warn('   ⚠️ No properties found to seed reviews for.');
    return { totalProperties: 0, totalReviewsCreated: 0, averageRating: 0, ratingBreakdown: {} };
  }

  // 2. Fetch all agent users to serve as realistic reviewers
  const agentUsers = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  });

  if (agentUsers.length === 0) {
    console.warn('   ⚠️ No agent users found to serve as reviewers.');
    return { totalProperties: 0, totalReviewsCreated: 0, averageRating: 0, ratingBreakdown: {} };
  }

  console.log(`   • Sourcing reviewers from pool of ${agentUsers.length} agents...`);

  // 3. Clear existing reviews to ensure idempotency
  await prisma.review.deleteMany();

  // 4. Generate reviews across all properties
  const allReviews: ReviewSeedItem[] = [];
  const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0 };

  for (const property of properties) {
    const propertyReviews = generateReviewsForProperty(property.id, agentUsers, {
      minReviews: 2,
      maxReviews: 5,
      listingAgentId: property.agentId,
    });

    for (const r of propertyReviews) {
      allReviews.push(r);
      ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] || 0) + 1;
    }
  }

  // 5. Batch insert reviews into database
  console.log(`   • Inserting ${allReviews.length} realistic reviews across ${properties.length} properties...`);
  await prisma.review.createMany({
    data: allReviews,
  });

  const totalRatingSum = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = allReviews.length > 0 ? totalRatingSum / allReviews.length : 0;

  console.log(`   ✅ Seeded ${allReviews.length} reviews (Avg: ${averageRating.toFixed(2)}★)`);
  console.log(`      5★: ${ratingBreakdown[5] || 0} | 4★: ${ratingBreakdown[4] || 0} | 3★: ${ratingBreakdown[3] || 0}`);

  return {
    totalProperties: properties.length,
    totalReviewsCreated: allReviews.length,
    averageRating: Number(averageRating.toFixed(2)),
    ratingBreakdown,
  };
}
