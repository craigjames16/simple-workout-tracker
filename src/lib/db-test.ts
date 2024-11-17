import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('Successfully connected to database');
    
    // Test query
    const count = await prisma.exercise.count();
    console.log(`Current exercise count: ${count}`);
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Self-executing async function
(async () => {
  await testConnection();
})(); 