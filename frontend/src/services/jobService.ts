import api from "@/lib/axios";
import { JobResponse } from "@/types";

export const jobService = {
  async getAllJobs() {
    try {
      const { data } = await api.get<JobResponse[]>("/jobs");
      return data;
    } catch (error) {
      console.error("Error fetching jobs: ", error);
      throw error;
    }
  },

  async syncNewJobs() {
    try {
      const { data } = await api.get("/jobs/sync-new-jobs");
      return data;
    } catch (error) {
      console.error("Error syncing jobs: ", error);
      throw error;
    }
  },
};
