
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to pick random item from array
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper to maybe return a value or null (probability 0-1)
const maybe = <T>(val: T, probability: number = 0.5): T | null => Math.random() < probability ? val : null;

const NAMES = [
  'Suzuki', 'Tanaka', 'Sato', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
  'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki'
];

const FIRST_NAMES = [
  'Ken', 'Taro', 'Jiro', 'Hanako', 'Yuki', 'Yumi', 'Hiroshi', 'Akiko', 'Keiko', 'Manabu',
  'Satoshi', 'Rina', 'Kaori', 'Daiki', 'Kenta', 'Miki', 'Eri', 'Tomoko', 'Sho', 'Mai'
];

const ALLERGIES = [
  'WHEAT', 'DAIRY', 'EGG', 'SHRIMP', 'PEANUTS', 'SOY', 'BUCKWHEAT', 'None', 'None', 'None', 'None', 'None'
];

const REQUESTS = [
  'Quiet room', 'Near elevator', 'Extra pillows', 'High floor requested', 'Ocean view',
  'Late checkout', 'Non-smoking', 'Vegetarian', 'Celebrating anniversary', 'Needs baby cot',
  'Window seat preference for dining', 'Allergic to dust', 'Early check-in'
];

async function main() {
  console.log('Seeding database with expanded guest list...');

  // 1. Existing Demo Guest
  await prisma.guest.upsert({
    where: { roomNumber: '305' },
    update: {},
    create: {
      roomNumber: '305',
      name: 'Yamada Taro',
      allergies: 'WHEAT',
      notes: 'Likes window seat',
      visitCount: 3,
      lastVisit: new Date('2024-12-20'),
    },
  });

  // 2. Generate Guests for Rooms 201-510
  // Floors 2 to 5
  for (let floor = 2; floor <= 5; floor++) {
    // Rooms 1 to 10
    for (let room = 1; room <= 10; room++) {
      const roomNum = `${floor}${room.toString().padStart(2, '0')}`; // e.g., "201"

      // Skip 305 as it's our demo user
      if (roomNum === '305') continue;

      const randomName = `${pick(NAMES)} ${pick(FIRST_NAMES)}`;
      const randomAllergy = pick(ALLERGIES);
      const randomRequest = maybe(pick(REQUESTS), 0.3); // 30% chance of request

      await prisma.guest.upsert({
        where: { roomNumber: roomNum },
        update: {}, // Don't overwrite if exists to preserve manual changes if any
        create: {
          roomNumber: roomNum,
          name: randomName,
          allergies: randomAllergy === 'None' ? null : randomAllergy,
          notes: randomRequest,
          visitCount: Math.floor(Math.random() * 5), // 0-4 previous visits
          lastVisit: maybe(new Date(new Date().getTime() - Math.random() * 10000000000), 0.5),
        },
      });
    }
  }

  // 3. Tables (Upsert ensures we don't duplicate or error)
  const tables = [
    { number: 1, capacity: 4 },
    { number: 2, capacity: 4 },
    { number: 3, capacity: 2 },
    { number: 4, capacity: 2 },
    { number: 5, capacity: 6 },
  ];

  for (const t of tables) {
    await prisma.table.upsert({
      where: { number: t.number },
      update: {},
      create: {
        number: t.number,
        capacity: t.capacity,
        status: 'AVAILABLE',
      },
    });
  }

  // 4. Menu Items
  const menuItems = [
    { name: 'Margherita', price: 1500, description: 'Tomato sauce, mozzarella, basil', allergens: 'WHEAT,DAIRY', prepTime: 10 },
    { name: 'Quattro Formaggi', price: 1800, description: 'Four cheeses, honey', allergens: 'WHEAT,DAIRY', prepTime: 12 },
    { name: 'Carbonara', price: 1600, description: 'Creamy sauce, bacon, egg', allergens: 'WHEAT,DAIRY,EGG,PORK', prepTime: 15 },
    { name: 'Kids Set', price: 900, description: 'Mini pizza, juice, toy', allergens: 'WHEAT,DAIRY', prepTime: 8 },
    { name: 'Caesar Salad', price: 800, description: 'Romaine, croutons, parmesan', allergens: 'WHEAT,DAIRY,EGG', prepTime: 5 },
    { name: 'Tiramisu', price: 600, description: 'Coffee flavored Italian dessert', allergens: 'WHEAT,DAIRY,EGG', prepTime: 0 },
  ];

  for (const item of menuItems) {
    // Check if exists to avoid duplication on re-seed (simplistic check by name)
    const exists = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (!exists) {
      await prisma.menuItem.create({ data: item });
    }
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
