import timburr_api from '@/config/axios';
import { JobRepository } from '@/models/repositories/JobRepository';

const jobServices = {
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
};

export default jobServices;
