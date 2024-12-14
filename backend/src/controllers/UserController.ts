import userServices from '@/services/UserServices';
import { Request, Response } from 'express';

import { error as userError } from '@/errors/userError';

export const getUser = async (req: Request, res: Response) => {};

export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;
	try {
		const result = await userServices.login(email, password);
		res.status(201).json(result);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === userError.INVALID_EMAIL_OR_PASSWORD)
				res.status(401).json({ error: error.message });
			else if (error.message === userError.MISSING_EMAIL_OR_PASSWORD)
				res.status(400).json({ error: error.message });
			else {
				res.status(500).json({ error: userError.DEFAULT });
			}
		} else res.status(500).json({ error: userError.DEFAULT });
	}
};

export const register = async (req: Request, res: Response) => {
	const userData = req.body;
	try {
		const user = await userServices.register(userData);
		res.status(201).json(user);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === userError.EMAIL_USED)
				res.status(401).json({ error: error.message });
			else if (error.message === userError.CREATE_USER_FAILED) {
				res.status(500).json({ error: userError.CREATE_USER_FAILED });
			} else if (error.message === userError.MISSING_REGISTER_DATA)
				res.status(400).json({ error: error.message });
			else res.status(500).json({ error: userError.DEFAULT });
		} else res.status(500).json({ error: userError.DEFAULT });
	}
};
