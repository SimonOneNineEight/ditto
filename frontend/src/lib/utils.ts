import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { JobResponse, JobTableRow } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertJobResponseToTableRow = (
  jobResponse: JobResponse[] | null = [],
): JobTableRow[] => {
  if (!jobResponse || jobResponse.length === 0) return [];
  return jobResponse.map((job: JobResponse): JobTableRow => {
    const { id, company, title, location, date, job_url, apply_status } = job;

    return {
      id,
      company,
      title,
      location,
      date,
      applyStatus: apply_status,
      jobUrl: job_url,
    };
  });
};
