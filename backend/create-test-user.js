import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Create a test user
    const user = await prisma.user.upsert({
      where: { id: 'test-user-direct' },
      update: {},
      create: {
        id: 'test-user-direct',
        email: 'test@example.com',
      },
    });
    
    console.log('✅ Test user created:', user);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
