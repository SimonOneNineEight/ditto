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
  jobUrl: string;
  jobPostingId: string;
  isApplied: boolean;
  isOffered: boolean;
};

export type JobDescriptionResponse = {
  id: string;
  jobPostingId: string;
  jobDescription: string;
};
