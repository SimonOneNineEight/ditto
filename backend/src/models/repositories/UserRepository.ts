import prisma from '@/config/prisma';

export class UserRepository {
	static async getUser(id: string) {
		try {
			return await prisma.user.findUnique({
				where: { id: Number(id) },
			});
		} catch (error) {
			console.error('Error in UserRepository.getUser: ', error);
		}
	}

	static async createUser(data: {
		name: string;
		email: string;
		password: string;
	}) {
		try {
			const user = await prisma.user.create({ data });

			return user;
		} catch (error) {
			console.error('Error in UserRepository.register: ', error);
		}
	}
}
