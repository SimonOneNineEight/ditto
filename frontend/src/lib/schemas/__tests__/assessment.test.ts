import { assessmentSchema } from "../assessment";

describe("assessmentSchema", () => {
  const validData = {
    assessment_type: "take_home_project" as const,
    title: "Build a REST API",
    due_date: new Date("2025-04-15"),
  };

  it("validates minimal required fields", () => {
    expect(assessmentSchema.safeParse(validData).success).toBe(true);
  });

  it("validates with optional fields", () => {
    const full = {
      ...validData,
      instructions: "Build a REST API with CRUD operations",
      requirements: "Use Go and PostgreSQL",
    };
    expect(assessmentSchema.safeParse(full).success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = assessmentSchema.safeParse({
      assessment_type: "take_home_project",
      due_date: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = assessmentSchema.safeParse({
      ...validData,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 255 characters", () => {
    const result = assessmentSchema.safeParse({
      ...validData,
      title: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing assessment_type", () => {
    const result = assessmentSchema.safeParse({
      title: "Test",
      due_date: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid assessment_type", () => {
    const result = assessmentSchema.safeParse({
      ...validData,
      assessment_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid assessment types", () => {
    const types = [
      "take_home_project",
      "live_coding",
      "system_design",
      "data_structures",
      "case_study",
      "other",
    ] as const;
    for (const type of types) {
      const result = assessmentSchema.safeParse({
        ...validData,
        assessment_type: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects instructions over 10000 chars", () => {
    const result = assessmentSchema.safeParse({
      ...validData,
      instructions: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing due_date", () => {
    const result = assessmentSchema.safeParse({
      assessment_type: "take_home_project",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });
});
