package com.simon198.oddish.services;

import com.simon198.oddish.exception.ResourceNotFoundException;
import com.simon198.oddish.model.Job;
import com.simon198.oddish.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobService {
	@Autowired
	private JobRepository jobsRepository;

	public List<Job> getAllJobs() {
		return jobsRepository.findAll();
	}

	public Job getJobById(Long id) {
		return jobsRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Job with ID " + id + " not found"));
	}
}
