import { cn, convertJobResponseToTableRow } from "../utils";
import { JobResponse } from "@/types";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });
});

describe("convertJobResponseToTableRow", () => {
  it("returns empty array for null input", () => {
    expect(convertJobResponseToTableRow(null)).toEqual([]);
  });

  it("returns empty array for empty array", () => {
    expect(convertJobResponseToTableRow([])).toEqual([]);
  });

  it("converts job responses to table rows", () => {
    const jobs: JobResponse[] = [
      {
        id: "1",
        company: "Acme",
        title: "Engineer",
        location: "Remote",
        date: "2024-01-01",
        job_url: "https://example.com",
        job_posting_id: "jp-1",
        is_applied: true,
        is_offered: false,
        apply_status: "Applied",
      },
    ];
    const rows = convertJobResponseToTableRow(jobs);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: "1",
      company: "Acme",
      title: "Engineer",
      location: "Remote",
      date: "2024-01-01",
      jobUrl: "https://example.com",
      applyStatus: "Applied",
    });
  });
});
