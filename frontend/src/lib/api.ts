import { JobResponse } from "@/types";

const ODDISH_API_URL = process.env.NEXT_PUBLIC_ODDISH_API_URL;
const TIMBURR_API_URL = process.env.NEXT_PUBLIC_TIMBURR_API_URL;

const ODDISH_ROUTER = {
  getJobs: `${ODDISH_API_URL}/jobs`,
};

const apiRequest = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T | null> => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `HTTP Error: ${response.status} - ${response.statusText}`,
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("API error:", error.message);
    } else {
      console.error("Unknown error occurred:", error);
    }
    throw error;
  }
};

const fetchJobs = async (): Promise<JobResponse[] | null> => {
  const jobs = await apiRequest<JobResponse[]>(ODDISH_ROUTER.getJobs);
  return jobs;
};

export { fetchJobs };
