import prisma from '@/config/prisma';

export class JobRepository {
	async findAll() {
		return await prisma.jobs.findMany();
	}
}
