import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import { jobRouter } from './routers';

const app = express();
const PORT = 8082;

const prisma = new PrismaClient();

app.use(express.json());
app.use(cors({ origin: '*' }));

app.use((req: Request, res: Response, next: NextFunction): void => {
	res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
	res.header(
		'Access-Control-Allow-Methods',
		'GET, POST, PATCH, DELETE, OPTIONS'
	); // Allow specific methods
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow specific headers

	if (req.method === 'OPTIONS') {
		res.sendStatus(200); // Preflight request handled
	}

	next();
});

app.get('/', async (_: Request, res: Response) => {
	const jobsCount = await prisma.jobs.count();
	res.send(`Hello, ditto! jobsCount = ${jobsCount}`);
});

app.use('/jobs', jobRouter);

app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
