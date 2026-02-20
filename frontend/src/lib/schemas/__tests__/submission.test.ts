import { submissionSchema } from "../submission";

describe("submissionSchema", () => {
  it("validates github submission with valid URL", () => {
    const result = submissionSchema.safeParse({
      submission_type: "github",
      github_url: "https://github.com/user/repo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects github submission without URL", () => {
    const result = submissionSchema.safeParse({
      submission_type: "github",
    });
    expect(result.success).toBe(false);
  });

  it("rejects github submission with empty URL", () => {
    const result = submissionSchema.safeParse({
      submission_type: "github",
      github_url: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects github submission with non-http URL", () => {
    const result = submissionSchema.safeParse({
      submission_type: "github",
      github_url: "ftp://github.com/repo",
    });
    expect(result.success).toBe(false);
  });

  it("validates notes submission with content", () => {
    const result = submissionSchema.safeParse({
      submission_type: "notes",
      notes: "My solution approach was...",
    });
    expect(result.success).toBe(true);
  });

  it("rejects notes submission without notes", () => {
    const result = submissionSchema.safeParse({
      submission_type: "notes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes submission with empty notes", () => {
    const result = submissionSchema.safeParse({
      submission_type: "notes",
      notes: "  ",
    });
    expect(result.success).toBe(false);
  });

  it("validates file_upload submission with file_id", () => {
    const result = submissionSchema.safeParse({
      submission_type: "file_upload",
      file_id: "abc-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects file_upload submission without file_id", () => {
    const result = submissionSchema.safeParse({
      submission_type: "file_upload",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid submission_type", () => {
    const result = submissionSchema.safeParse({
      submission_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes over 10000 characters", () => {
    const result = submissionSchema.safeParse({
      submission_type: "notes",
      notes: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });
});
