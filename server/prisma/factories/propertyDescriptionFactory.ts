import { PropertyType, PriceType } from '@prisma/client';

export interface PropertyDescriptionContext {
  title?: string;
  type: PropertyType | string;
  city: string;
  beds: number;
  baths: number;
  sqft: number;
  price?: number;
  priceType?: PriceType | string;
  hasParking?: boolean;
  petFriendly?: boolean;
  builtYear?: number;
}

// ---------------------------------------------------------------------------
// 1. OPENING HOOKS
// ---------------------------------------------------------------------------
const HOUSE_HOOKS = [
  "Welcome to this exquisitely maintained detached home nestled in one of the most coveted neighborhoods of {city}.",
  "Experience exceptional comfort and elevated style in this stunning single-family residence in {city}.",
  "A rare find in {city}, this beautifully appointed house offers the perfect harmony of classic architecture and modern elegance.",
  "Offering an expansive footprint and welcoming curb appeal, this magnificent {city} home is move-in ready from day one.",
  "Step into refined everyday living with this remarkable property located in a tranquil, tree-lined enclave of {city}.",
  "Captivating from the moment you arrive, this spacious residence delivers timeless charm and contemporary luxury in {city}."
];

const APT_HOOKS = [
  "Welcome to this sophisticated, sun-drenched apartment situated right in the vibrant heart of {city}.",
  "Urban elegance meets effortless convenience in this beautifully finished {city} apartment residence.",
  "A boutique living experience in {city}, this chic home features an open, airy layout with stunning natural lighting.",
  "Enjoy modern city living at its finest in this immaculately kept apartment in the desirable core of {city}.",
  "Offering clean architectural lines and supreme functionality, this turnkey apartment is a standout opportunity in {city}.",
  "Tucked into a prime {city} location, this stylish residence combines private tranquility with quick urban connectivity."
];

const CONDO_HOOKS = [
  "Welcome to premier low-maintenance luxury in this sleek and stylish condominium residence in {city}.",
  "Breathtaking natural light and thoughtful designer finishes define this exceptional condo in {city}.",
  "Impeccably designed for modern lifestyles, this turnkey condominium offers refined living in central {city}.",
  "Elevate your daily routine in this sunlit condo featuring premier finishes and effortless access to {city}'s finest attractions.",
  "A prime condominium opportunity in {city}, this home pairs private tranquility with upscale contemporary amenities.",
  "Clean lines, designer aesthetics, and an open layout make this {city} condo an exceptional place to call home."
];

const TOWNHOUSE_HOOKS = [
  "Welcome to this elegant multi-level townhome delivering the perfect blend of generous space and urban ease in {city}.",
  "Distinctive architecture and thoughtful multi-level zoning highlight this immaculate townhouse in {city}.",
  "Offering the privacy of a single-family home with the low-maintenance perks of townhome living, this {city} residence is a rare gem.",
  "Step inside this beautifully crafted townhome in {city}, featuring generous proportions and an inviting open floor plan.",
  "A sanctuary of modern design in {city}, this multi-level residence provides an ideal retreat for both living and entertaining."
];

// ---------------------------------------------------------------------------
// 2. LIVING AREA & NATURAL LIGHT
// ---------------------------------------------------------------------------
const LIVING_AREA_HIGHLIGHTS = [
  "The main living area boasts soaring ceilings and oversized panoramic windows that bathe the entire floor in warm natural sunlight throughout the morning and afternoon.",
  "Step into a generous open-concept great room accented by rich hardwood flooring, warm neutral palettes, and floor-to-ceiling windows with scenic neighborhood vistas.",
  "Designed with seamless entertaining in mind, the expansive living room transitions effortlessly between casual lounge seating and a formal dining nook.",
  "The living room serves as the radiant heart of the home, featuring sun-drenched exposures, crisp architectural trim, and direct sightlines across the open floor plan.",
  "Abundant south-facing exposures flood the main reception areas with golden daylight, highlighting the bespoke finishes and pristine flooring beneath.",
  "High ceilings and broad wall spaces provide an airy, loft-like ambiance that accommodates large furniture configurations and custom art displays with ease."
];

// ---------------------------------------------------------------------------
// 3. CHEF'S KITCHEN & DINING
// ---------------------------------------------------------------------------
const KITCHEN_HIGHLIGHTS = [
  "Culinary enthusiasts will fall in love with the gourmet kitchen, showcasing polished quartz countertops, stainless steel appliances, custom soft-close shaker cabinetry, and an expansive breakfast bar island.",
  "The chef-inspired kitchen is equipped with top-tier energy-efficient appliances, durable stone surfaces, a deep undermount sink, and extensive pantry storage for all your culinary needs.",
  "At the center of the residence sits a beautifully renovated kitchen featuring custom subway tile backsplashes, sleek quartz counters, and a central prep island ideal for weeknight dinners and weekend hosting.",
  "The open-concept kitchen pairs functional elegance with designer appeal, offering ample counter space, premium gas range cooking, and warm pendant lighting over the dining bar.",
  "Cooking and hosting are effortless in this updated kitchen, complete with a full suite of modern appliances, elegant cabinetry, and seamless flow into the adjacent dining area."
];

// ---------------------------------------------------------------------------
// 4. BEDROOMS & SPA-INSPIRED BATHROOMS
// ---------------------------------------------------------------------------
const BEDROOM_STUDIO_HIGHLIGHTS = [
  "The intelligently partitioned studio layout provides dedicated sleeping, working, and living zones, complemented by a pristine full bathroom with modern spa-like fixtures.",
  "A space-maximizing floor plan offers a cozy, private alcove for rest, complemented by ample closet space and a designer bathroom with contemporary vanity and tilework."
];

const BEDROOM_MULTI_HIGHLIGHTS = [
  "The serene primary bedroom suite serves as a true sanctuary, complete with an expansive walk-in wardrobe and an en-suite bathroom featuring dual vanities, modern hardware, and a walk-in glass shower.",
  "Each bedroom is generously proportioned with abundant natural light and generous closet space. The primary suite features a tranquil private bath with porcelain tile finishes and a deep soaking tub.",
  "Retreat to the quiet primary bedroom featuring tree-lined views, plush finishes, and an en-suite bath designed with hotel-inspired luxury and contemporary vanity storage.",
  "The well-appointed secondary bedrooms offer exceptional versatility for guest quarters, a children's nursery, or a dedicated sunlit work-from-home executive office.",
  "Bedrooms are thoughtfully tucked away to maximize acoustic privacy and quiet relaxation, all serviced by modern bathrooms with upgraded plumbing fixtures and fresh vanity mirrors."
];

// ---------------------------------------------------------------------------
// 5. AMENITIES, OUTDOOR LIVING & EXTRAS
// ---------------------------------------------------------------------------
const OUTDOOR_AND_STORAGE_HIGHLIGHTS = [
  "Step outside to your private outdoor retreat—ideal for savoring peaceful morning coffees, alfresco dining on warm evenings, or hosting summer barbecues.",
  "A private outdoor space provides a peaceful breath of fresh air and quiet respite from the bustling city tempo.",
  "The property features thoughtful additions throughout, including dedicated in-unit laundry facilities, abundant storage closets, and high-efficiency climate controls.",
  "Modern lifestyle conveniences abound, featuring multi-zone climate control, energy-saving LED fixtures, and robust closet organization systems."
];

const PARKING_HIGHLIGHTS = [
  "Dedicated off-street parking ensures effortless everyday convenience and total peace of mind.",
  "Includes assigned private parking with convenient, secure access straight to your front door.",
  "Enjoy the valuable convenience of dedicated parking on site—a sought-after luxury in this neighborhood."
];

const PET_HIGHLIGHTS = [
  "The pet-friendly community and nearby parks make this property a paradise for four-legged family members.",
  "Pet lovers will appreciate the welcoming pet-friendly policy and immediate proximity to green spaces and walking trails."
];

// ---------------------------------------------------------------------------
// 6. NEIGHBORHOOD LIFESTYLE & WALKABILITY
// ---------------------------------------------------------------------------
const LOCATION_HIGHLIGHTS = [
  "Positioned in a vibrant and walkable neighborhood, you are just moments away from artisan coffee shops, acclaimed dining, neighborhood markets, and lush public parks.",
  "Enjoy the ultimate balance of suburban serenity and urban convenience, with swift access to commuter thoroughfares, express transit lines, and daily shopping essentials.",
  "The location is second to none: a quiet residential street with tree-shaded sidewalks, yet only minutes from top-rated schools, boutique retail, and community entertainment.",
  "Commuting is effortless with rapid access to public transit corridors, highway connections, and popular neighborhood cycling paths.",
  "Nestled within a friendly, established community known for its safe, walkable streets, scenic parks, and active neighborhood atmosphere."
];

// ---------------------------------------------------------------------------
// 7. CLOSING CALL-TO-ACTIONS
// ---------------------------------------------------------------------------
const CLOSING_STATEMENTS = [
  "Turnkey, stylish, and remarkably maintained, this standout home represents an extraordinary opportunity for discerning buyers and renters alike. Schedule your private walkthrough today!",
  "A truly complete package that checks every single box on your wishlist. Don't miss the chance to make this exceptional residence your next home!",
  "Rarely does a property of this quality, condition, and location reach the market at this price point. Inquire today to arrange a personalized tour.",
  "Offering an unbeatable combination of space, modern upgrades, and prime location, this property is ready for immediate occupancy. Book your visit now!",
  "Move-in ready with nothing left to do but unpack and enjoy. Contact the listing agent today to secure your private viewing!"
];

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveHook(type: PropertyType | string, city: string): string {
  let template = '';
  switch (type) {
    case PropertyType.HOUSE:
    case 'HOUSE':
      template = pickOne(HOUSE_HOOKS);
      break;
    case PropertyType.APT:
    case 'APT':
    case 'APARTMENT':
      template = pickOne(APT_HOOKS);
      break;
    case PropertyType.CONDO:
    case 'CONDO':
      template = pickOne(CONDO_HOOKS);
      break;
    case PropertyType.TOWNHOUSE:
    case 'TOWNHOUSE':
      template = pickOne(TOWNHOUSE_HOOKS);
      break;
    default:
      template = pickOne(HOUSE_HOOKS);
  }
  return template.replace(/{city}/g, city);
}

/**
 * Generates a realistic, highly authentic property description strictly avoiding lorem ipsum.
 * Combines structural specifications, architectural flow, chef's kitchen highlights,
 * bedroom/bathroom luxury, neighborhood convenience, and closing calls-to-action.
 */
export function generatePropertyDescription(ctx: PropertyDescriptionContext): string {
  const city = ctx.city || 'the city';
  const beds = typeof ctx.beds === 'number' ? ctx.beds : 2;
  const baths = typeof ctx.baths === 'number' ? ctx.baths : 2;
  const sqft = typeof ctx.sqft === 'number' ? ctx.sqft : 1200;
  const typeName = String(ctx.type).toLowerCase();

  // Paragraph 1: Hook, architectural specs, and living area
  const hook = resolveHook(ctx.type, city);
  const specSentence = `Featuring ${beds === 0 ? 'an expansive studio' : `${beds} spacious bedroom${beds > 1 ? 's' : ''}`}, ${baths} luxury bathroom${baths > 1 ? 's' : ''}, and over ${sqft.toLocaleString()} square feet of thoughtfully planned living space, this ${typeName} is designed for comfort, functionality, and effortless hosting.`;
  const livingHighlight = pickOne(LIVING_AREA_HIGHLIGHTS);
  const paragraph1 = `${hook} ${specSentence} ${livingHighlight}`;

  // Paragraph 2: Kitchen, bedrooms & bathrooms
  const kitchenHighlight = pickOne(KITCHEN_HIGHLIGHTS);
  const bedHighlight = beds === 0 ? pickOne(BEDROOM_STUDIO_HIGHLIGHTS) : pickOne(BEDROOM_MULTI_HIGHLIGHTS);
  const paragraph2 = `${kitchenHighlight} ${bedHighlight}`;

  // Paragraph 3: Amenities, parking, pets, neighborhood & closing CTA
  const outdoorHighlight = pickOne(OUTDOOR_AND_STORAGE_HIGHLIGHTS);
  const parkingText = ctx.hasParking ? ` ${pickOne(PARKING_HIGHLIGHTS)}` : '';
  const petText = ctx.petFriendly ? ` ${pickOne(PET_HIGHLIGHTS)}` : '';
  const locationHighlight = pickOne(LOCATION_HIGHLIGHTS);
  const closingCta = pickOne(CLOSING_STATEMENTS);
  const paragraph3 = `${outdoorHighlight}${parkingText}${petText} ${locationHighlight} ${closingCta}`;

  return `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;
}
