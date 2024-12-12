import { JobRepository } from '@/models/repositories/JobRepository';

export class JobService {
	private jobRepository: JobRepository;

	constructor() {
		this.jobRepository = new JobRepository();
	}

	async getAllJobs() {
		return await this.jobRepository.findAll();
	}
}
