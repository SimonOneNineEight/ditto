package com.simon198.oddish.controller;

import com.simon198.oddish.exception.ResourceNotFoundException;
import com.simon198.oddish.model.Job;
import com.simon198.oddish.model.JobDescription;
import com.simon198.oddish.services.JobDescriptionService;
import com.simon198.oddish.services.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/jobs")
public class JobController {

	@Autowired
	private JobService jobService;
	@Autowired
	private JobDescriptionService jobDescriptionService;

	@GetMapping
	public ResponseEntity<List<Job>> getAllJobs() {
		List<Job> jobs = jobService.getAllJobs();

		if (jobs.isEmpty()) {
			return ResponseEntity.noContent().build();
		} else {
			return ResponseEntity.ok(jobs);
		}
	}

	@GetMapping("/description/{jobId}")
	public ResponseEntity<JobDescription> getJobDescriptionByJobId(@PathVariable Long jobId) {
		try {
			JobDescription jobDescription = jobDescriptionService.getJobDescriptionByJobId(jobId);
			return ResponseEntity.ok(jobDescription);
		} catch (ResourceNotFoundException e) {
			return ResponseEntity.status(404).body(null);
		} catch (Exception e) {
			return ResponseEntity.status(500).body(null);
		}
	}
}
