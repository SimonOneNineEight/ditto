"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { jobService } from "@/services/jobService"
import { convertJobResponseToTableRow } from "@/lib/utils"
import { JobTableRow } from "@/types"

interface ScrapeButtonProps {
    setJobs: React.Dispatch<React.SetStateAction<JobTableRow[]>>
}

const ScrapeButton: React.FC<ScrapeButtonProps> = ({ setJobs }) => {
    const onScrapeButtonClick = async () => {
        try {
            await jobService.syncNewJobs();
            const newData = await jobService.getAllJobs();
            setJobs(convertJobResponseToTableRow(newData));
        } catch (error: unknown) {
            console.error(error);
        }
    }


    return <Button onClick={onScrapeButtonClick}>Scrape</Button>
}

export default ScrapeButton
