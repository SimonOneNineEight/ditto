export type JobTableRow = {
  id: string;
  company: string;
  title: string;
  location: string;
  date: string;
  applyStatus: string;
  jobUrl: string;
};

export type JobResponse = {
  id: string;
  company: string;
  title: string;
  location: string;
  date: string;
  job_url: string;
  job_posting_id: string;
  is_applied: boolean;
  is_offered: boolean;
};

export type JobDescriptionResponse = {
  id: string;
  job_posting_id: string;
  job_description: string;
};
