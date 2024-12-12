import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { jobRouter } from './routers';

const app = express();
const PORT = 8082;

const prisma = new PrismaClient();

app.use(express.json());

app.get('/', async (_: Request, res: Response) => {
	const jobsCount = await prisma.jobs.count();
	res.send(`Hello, ditto! jobsCount = ${jobsCount}`);
});

app.use('/jobs', jobRouter);

app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
