import prisma from '@/config/prisma';

export class JobRepository {
	static async findAll() {
		try {
			return await prisma.jobs.findMany();
		} catch (error) {
			console.error('Error in JobRepository.findAll: ', error);
		}
	}
}
