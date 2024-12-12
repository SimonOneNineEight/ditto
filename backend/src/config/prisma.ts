import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma
	.$connect()
	.then(() => {
		console.log('Successfully conned to database');
	})
	.catch((error) => {
		console.error('Failed to connect to database', error);
	});

export default prisma;
