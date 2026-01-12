/**
 * Test script for Prisma Service
 * Run: node scripts/test-prisma.js
 */
require('dotenv').config();

async function testPrismaService() {
    console.log('='.repeat(60));
    console.log('Testing Prisma Service');
    console.log('='.repeat(60));

    try {
        const prismaService = require('../services/prismaService');
        console.log('\n✅ Prisma service loaded successfully!');

        // Wait for connection test
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 1: Count users
        console.log('\n📊 Test 1: Counting users...');
        const countResult = await prismaService.countListTable('user', {});
        console.log('User count:', countResult);

        // Test 2: Get all patients (empty)
        console.log('\n📊 Test 2: Getting patients...');
        const patientsResult = await prismaService.getAllDataTable('patients', { active: 1 });
        console.log('Patients count:', patientsResult.data?.length || 0);

        // Test 3: Add a test record
        console.log('\n📊 Test 3: Creating a test user...');
        const createResult = await prismaService.addRecordTable({
            fullname: 'Test User',
            email: 'test@example.com',
            password: 'test123',
            active: 1
        }, 'user', true);
        console.log('Create result:', createResult);

        if (createResult.success && createResult.data?.insertId) {
            // Test 4: Delete the test record
            console.log('\n📊 Test 4: Deleting test user...');
            const deleteResult = await prismaService.deleteRecordTable1(
                { id: createResult.data.insertId },
                'user'
            );
            console.log('Delete result:', deleteResult);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests completed!');
        console.log('='.repeat(60));

        // Cleanup
        await prismaService.prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

testPrismaService();
