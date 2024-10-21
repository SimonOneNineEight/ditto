package com.simon198.oddish.model;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "job_descriptions")
public class JobDescription {

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Long id;

	@Column(name = "job_description")
	private String jobDescription;

	@OneToOne
	@JoinColumn(name = "job_id", referencedColumnName = "id")
	private Job job;

	@Temporal(TemporalType.TIMESTAMP)
	private Date createdAt;

	@Temporal(TemporalType.TIMESTAMP)
	private Date updatedAt;

	// This method is automatically called when the entity is persisted
	@PrePersist
	protected void onCreate() {
		createdAt = new Date();
		updatedAt = new Date();
	}

	// This method is automatically called when the entity is updated
	@PreUpdate
	protected void onUpdate() {
		updatedAt = new Date();
	}

	public JobDescription() {
	}

	public JobDescription(String jobDescription, Job job) {
		this.jobDescription = jobDescription;
		this.job = job;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getJobDescription() {
		return jobDescription;
	}

	public void setJobDescription(String jobDescription) {
		this.jobDescription = jobDescription;
	}

	public Job getJob() {
		return job;
	}

	public void setJob(Job job) {
		this.job = job;
	}
}
