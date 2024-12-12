import timburr_api from '@/config/axios';
import { JobRepository } from '@/models/repositories/JobRepository';

interface JobServicesType {
	findAllJobs: () => Promise<any>;
	syncNewJobs: () => Promise<{ status: string; data: any }>;
	updateJobStatus: (id: string, status: string) => Promise<any>;
}

const jobServices: JobServicesType = {
	findAllJobs: async () => {
		return JobRepository.findAll();
	},
	syncNewJobs: async () => {
		try {
			const result = await timburr_api.get('/api/sync-new-jobs');

			return {
				status: 'success',
				data: result.data,
			};
		} catch (error) {
			throw error;
		}
	},
	updateJobStatus: async (id: string, status: string) => {
		try {
			const updatedJob = await JobRepository.updateStatus(id, status);

			return {
				data: updatedJob,
			};
		} catch {}
	},
};

export default jobServices;
