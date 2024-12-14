import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SERECT = process.env.JWT_SERECT || 'your-serect-key';

interface DecodedToken {
	id: number;
	email: string;
	iat: number;
	exp: number;
}

export const authToken = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.header('Authorization');
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(403).json({ error: 'Access denied: Token missing.' });
	}

	jwt.verify(token, JWT_SERECT, (err, user) => {
		if (err) {
			return res.status(403).json({ error: 'Invalid token.' });
		}

		req.user = { id: (user as DecodedToken).id };
		next();
	});
};
