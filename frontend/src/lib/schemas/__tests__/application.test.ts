import { applicationSchema, companySchema, urlImportSchema } from "../application";

describe("companySchema", () => {
  it("validates a valid company", () => {
    expect(companySchema.safeParse({ name: "Acme Inc" }).success).toBe(true);
  });

  it("rejects empty company name", () => {
    const result = companySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 255 characters", () => {
    const result = companySchema.safeParse({ name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });
});

describe("applicationSchema", () => {
  const validData = {
    company: { name: "Acme" },
    position: "Engineer",
  };

  it("validates minimal required fields", () => {
    expect(applicationSchema.safeParse(validData).success).toBe(true);
  });

  it("validates with all optional fields", () => {
    const full = {
      ...validData,
      location: "Remote",
      jobType: "full-time" as const,
      minSalary: "50000",
      maxSalary: "80000",
      description: "A job",
      sourceUrl: "https://example.com/job",
      platform: "linkedin",
      notes: "Great opportunity",
    };
    expect(applicationSchema.safeParse(full).success).toBe(true);
  });

  it("rejects empty position", () => {
    const result = applicationSchema.safeParse({
      company: { name: "Acme" },
      position: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid jobType", () => {
    const result = applicationSchema.safeParse({
      ...validData,
      jobType: "unknown",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid jobType values", () => {
    for (const jobType of ["full-time", "part-time", "contract", "internship"]) {
      const result = applicationSchema.safeParse({ ...validData, jobType });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid sourceUrl", () => {
    const result = applicationSchema.safeParse({
      ...validData,
      sourceUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty string sourceUrl", () => {
    const result = applicationSchema.safeParse({
      ...validData,
      sourceUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects description over 10000 chars", () => {
    const result = applicationSchema.safeParse({
      ...validData,
      description: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects position over 255 chars", () => {
    const result = applicationSchema.safeParse({
      company: { name: "Acme" },
      position: "x".repeat(256),
    });
    expect(result.success).toBe(false);
  });
});

describe("urlImportSchema", () => {
  it("validates a valid URL", () => {
    expect(
      urlImportSchema.safeParse({ url: "https://example.com" }).success,
    ).toBe(true);
  });

  it("rejects invalid URL", () => {
    expect(urlImportSchema.safeParse({ url: "not-a-url" }).success).toBe(false);
  });

  it("rejects empty URL", () => {
    expect(urlImportSchema.safeParse({ url: "" }).success).toBe(false);
  });
});
