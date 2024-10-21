package com.simon198.oddish.services;

import com.simon198.oddish.model.Job;
import com.simon198.oddish.model.JobDescription;
import com.simon198.oddish.repository.JobDescriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobDescriptionService {

	@Autowired
	private JobDescriptionRepository jobDescriptionRepository;

	@Autowired
	private JobService jobService;

	@Autowired
	private ExternalApiService externalApiService;

	public JobDescription getJobDescription(Long id) {
		return jobDescriptionRepository.findById(id).orElse(null);
	}

	public JobDescription getJobDescriptionByJobId(Long jobId) {
		JobDescription jobDescription = jobDescriptionRepository.findByJobId(jobId);
		if (jobDescription != null) return jobDescription;

		Job job = jobService.getJobById(jobId);

//		Call timburr to scrape job description
		jobDescription = externalApiService.scrapeJobDescription(jobId);

		return jobDescription;
	}
}
