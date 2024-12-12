import { Request, Response } from 'express';
import { JobServices } from '@/services';

export const getAllJobs = async (req: Request, res: Response) => {
	try {
		const jobs = await JobServices.findAllJobs();
		res.status(200).json(jobs);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Failed to fetch jobs' });
	}
};

export const getJobById = async (req: Request, res: Response) => {};
