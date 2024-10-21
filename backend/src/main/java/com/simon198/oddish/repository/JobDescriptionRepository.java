package com.simon198.oddish.repository;

import com.simon198.oddish.model.JobDescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescription, Long> {
	JobDescription findByJobId(Long jobId);
}
