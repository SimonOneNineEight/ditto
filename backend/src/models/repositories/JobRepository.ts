import prisma from '@/config/prisma';

export class JobRepository {
	static async findAll() {
		try {
			return await prisma.jobs.findMany({
				orderBy: {
					id: 'desc',
				},
			});
		} catch (error) {
			console.error('Error in JobRepository.findAll: ', error);
		}
	}

	static async updateStatus(id: string, status: string) {
		try {
			return await prisma.jobs.update({
				where: { id: Number(id) },
				data: {
					apply_status: status,
				},
			});
		} catch (error) {
			console.error('Error in JobRepository.updateStatus: ', error);
		}
	}

	static async scrapeJobs() {}
}
