import { JobRepository } from '@/models/repositories/JobRepository';

const jobServices = {
	findAllJobs: async () => {
		return JobRepository.findAll();
	},
};

export default jobServices;
