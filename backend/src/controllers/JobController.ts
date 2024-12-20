import { Request, Response } from 'express';
import { JobServices } from '@/services';

export const getAllJobs = async (_: Request, res: Response) => {
	try {
		const jobs = await JobServices.findAllJobs();
		res.status(200).json(jobs);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Failed to fetch jobs' });
	}
};

export const getJobById = async (req: Request, res: Response) => {};

export const syncNewJobs = async (_: Request, res: Response) => {
	try {
		const { data } = await JobServices.syncNewJobs();
		res.status(200).json({ status: 'success', data });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Failed to sync new jobs' });
	}
};

export const updateJobStatus = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { status } = req.body;
	console.log(id, status);

	try {
		const updatedJob = await JobServices.updateJobStatus(id, status);
		res.status(200).json(updatedJob);
	} catch (error) {
		console.error('Error updating job status: ', error);
		res.status(500).json({ error: 'Failed to update job status' });
	}
};
