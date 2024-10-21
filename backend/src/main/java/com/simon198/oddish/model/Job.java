package com.simon198.oddish.model;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "jobs")
public class Job {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String title;
	private String company;
	private String location;

	@Column(name = "job_posting_id")
	private String jobPostingId;

	@Column(name = "job_url")
	private String jobUrl;
	private Date date;


	@Column(name = "is_applied")
	private Boolean isApplied = false;

	@Column(name = "apply_status")
	private String applyStatus = "Not Applied";

	@Column(name = "is_offered")
	private Boolean isOffered = false;

	@OneToOne(mappedBy = "job", cascade = CascadeType.ALL)
	private JobDescription jobDescription;

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

	public Job() {}

	public Job(Long id, String title, String company, String location, String jobPostingId, String jobUrl, Date date) {
		this.id = id;
		this.title = title;
		this.company = company;
		this.location = location;
		this.jobPostingId = jobPostingId;
		this.jobUrl = jobUrl;
		this.date = date;
	}

	public Boolean getOffered() {
		return isOffered;
	}

	public void setOffered(Boolean offered) {
		isOffered = offered;
	}

	public String getApplyStatus() {
		return applyStatus;
	}

	public void setApplyStatus(String applyStatus) {
		this.applyStatus = applyStatus;
	}

	public Boolean getApplied() {
		return isApplied;
	}

	public void setApplied(Boolean applied) {
		isApplied = applied;
	}

	public JobDescription getJobDescription() {
		return jobDescription;
	}

	public void setJobDescription(JobDescription jobDescription) {
		this.jobDescription = jobDescription;
	}

	public Date getDate() {
		return date;
	}

	public void setDate(Date date) {
		this.date = date;
	}

	public String getJobUrl() {
		return jobUrl;
	}

	public void setJobUrl(String jobUrl) {
		this.jobUrl = jobUrl;
	}

	public String getJobPostingId() {
		return jobPostingId;
	}

	public void setJobPostingId(String jobPostingId) {
		this.jobPostingId = jobPostingId;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public String getCompany() {
		return company;
	}

	public void setCompany(String company) {
		this.company = company;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}
}
