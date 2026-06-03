/**
 * The Luxury Storyteller Engine
 * Generates high-fidelity, boutique-focused marketing copy for baby garments.
 */

const adjectives = [
  "Whisper-soft",
  "Cloud-like",
  "Ethereal",
  "Heirloom-quality",
  "Exquisite",
  "Hand-finished",
  "Timeless",
  "Artisanal",
  "Breathtaking",
  "Serene",
  "Gentle",
  "Pure",
  "Lustrous",
  "Sovereign",
  "Divine",
];

const materials = [
  "GOTS-certified organic cotton",
  "sustainably sourced silk",
  "brushed cashmere",
  "fine-gauge knit",
  "merino wool",
  "breathable linen",
  "velvety soft bamboo",
];

const features = [
  "mother-of-pearl buttons",
  "delicate hand-embroidery",
  "seamless construction",
  "scalloped edges",
  "vintage-inspired silhouettes",
  "elasticated comfort",
  "minimalist aesthetic",
];

const verbs = ["embraces", "cradles", "celebrates", "honors", "nurtures", "enchants", "perfects"];

const closings = [
  "Designed for the quietest moments.",
  "A legacy piece for the modern nursery.",
  "Crafted with love and intention.",
  "Where sophistication meets the softness of new beginnings.",
  "The ultimate expression of nursery luxury.",
];

export function generateLuxuryNarrative(name: string, category: string): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const mat = materials[Math.floor(Math.random() * materials.length)];
  const feat = features[Math.floor(Math.random() * features.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const close = closings[Math.floor(Math.random() * closings.length)];

  const structures = [
    `${adj} and intentionally crafted, the ${name} ${verb} your little one in ${mat}. Featuring ${feat}, it is a masterpiece of ${category.toLowerCase()}. ${close}`,
    `Discover the ${adj} charm of our ${name}. This ${mat} essential is elevated by ${feat}, ensuring it ${verb} every morning. ${close}`,
    `The ${name} is a ${adj} tribute to nursery elegance. Woven from ${mat} and finished with ${feat}, it ${verb} the skin of your most precious treasure. ${close}`,
    `Simple. ${adj}. Essential. Our ${name} in ${mat} is a ${adj} addition to any collection. ${close}`,
  ];

  return structures[Math.floor(Math.random() * structures.length)];
}

export function generateSustainabilityPromise(): string {
  const promises = [
    "100% certified organic, GOTS-grown materials. Natural wood buttons and non-toxic, low-impact dyes. Crafted in small batches by artisan partners. Recyclable, plastic-free packaging.",
    "Sustainably harvested fibers meeting the highest ethical standards. Water-saving production techniques and fair-wage artisanal craftsmanship. Carbon-neutral shipping and zero-waste packaging.",
    "Heritage techniques meeting modern ecology. Every thread is traceable to ethical farms. Dyed using botanical extracts. Designed to last through generations.",
  ];
  return promises[Math.floor(Math.random() * promises.length)];
}

export function generateCareInstructions(): string {
  const instructions = [
    "Machine wash cold on a delicate cycle with mild detergent. Lay flat to dry to preserve softness and shape. Iron on low if needed.",
    "Hand wash recommended in lukewarm water. Use pH-neutral soap. Do not wring. Dry in the shade to protect the natural fibers.",
    "Professional eco-friendly dry clean or gentle machine wash inside a mesh bag. Reshape while damp. Love and care for this piece, and it will love you back.",
  ];
  return instructions[Math.floor(Math.random() * instructions.length)];
}
