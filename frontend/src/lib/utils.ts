import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { JobResponse, JobTableRow } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertJobResponseToTableRow = (
  jobResponse: JobResponse[],
): JobTableRow[] => {
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
      jobUrl,
      is_applied,
      is_offered,
    } = job;
  });
};
