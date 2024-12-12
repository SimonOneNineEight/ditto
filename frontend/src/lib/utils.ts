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
  // export type JobTableRow = {
  //   id: string;
  //   company: string;
  //   title: string;
  //   location: string;
  //   date: string;
  //   applyStatus: string;
  //   jobUrl: string;
  // };
  //
  // export type JobResponse = {
  //   id: string;
  //   company: string;
  //   title: string;
  //   location: string;
  //   date: string;
  //   jobUrl: string;
  //   job_post_id: string;
  //   applyStatus: string;
  //   applied: boolean;
  //   offered: boolean;
  // };
  return jobResponse.map((job: JobResponse): JobTableRow => {
    const {
      id,
      company,
      title,
      location,
      date,
      job_url,
      is_applied,
      is_offered,
    } = job;

    return {
      id,
      company,
      title,
      location,
      date,
      applyStatus: is_applied
        ? "Applied"
        : is_offered
          ? "Offered"
          : "Not Applied",
      jobUrl: job_url,
    };
  });
};
