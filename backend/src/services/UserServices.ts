import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { UserRepository } from '@/models/repositories';
import { error } from '@/errors/userError';

const JWT_SERECT = process.env.JWT_SERECT || 'your-serect-key';

interface UserServicesType {
	getUser: (id: string) => Promise<any>;
	login: (email: string, password: string) => Promise<any>;
	register: (userData: {
		name: string;
		email: string;
		password: string;
	}) => Promise<any>;
}

const userServices: UserServicesType = {
	getUser: async (id: string) => {
		try {
			const user = await UserRepository.getUser(id);

			return {
				data: user,
			};
		} catch (error) {
			throw error;
		}
	},
	login: async (email: string, password: string) => {
		if (!email || !password)
			throw new Error(error.MISSING_EMAIL_OR_PASSWORD);
		const user = await UserRepository.getUser(email);

		if (!user) throw new Error(error.INVALID_EMAIL_OR_PASSWORD);

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) throw new Error(error.INVALID_EMAIL_OR_PASSWORD);

		const token = jwt.sign({ id: user.id }, JWT_SERECT, {
			expiresIn: '6h',
		});

		return token;
	},
	register: async (userData: {
		name: string;
		email: string;
		password: string;
	}) => {
		const { name, email, password } = userData;

		if (!name || !email || !password)
			throw new Error(error.MISSING_REGISTER_DATA);

		try {
			const user = await UserRepository.getUser(email);
			if (user) throw new Error(error.EMAIL_USED);

			const hashedPassword = await bcrypt.hash(password, 10);
			const newUser = await UserRepository.createUser({
				...userData,
				password: hashedPassword,
			});

			if (!newUser) throw new Error(error.CREATE_USER_FAILED);

			const token = jwt.sign({ id: newUser.id }, JWT_SERECT, {
				expiresIn: '6h',
			});

			return {
				user: {
					id: newUser.id,
					name: newUser.name,
					email: newUser.email,
				},
				token,
			};
		} catch (error) {
			throw error;
		}
	},
};

export default userServices;
