import { interviewFormSchema, addRoundSchema } from "../interview";

describe("interviewFormSchema", () => {
  const validData = {
    interview_type: "technical" as const,
    scheduled_date: new Date("2025-03-15"),
  };

  it("validates minimal required fields", () => {
    expect(interviewFormSchema.safeParse(validData).success).toBe(true);
  });

  it("validates with optional fields", () => {
    const full = {
      ...validData,
      scheduled_time: "14:00",
      duration_minutes: "60",
    };
    expect(interviewFormSchema.safeParse(full).success).toBe(true);
  });

  it("rejects missing interview_type", () => {
    const result = interviewFormSchema.safeParse({
      scheduled_date: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing scheduled_date", () => {
    const result = interviewFormSchema.safeParse({
      interview_type: "technical",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid interview_type", () => {
    const result = interviewFormSchema.safeParse({
      interview_type: "invalid_type",
      scheduled_date: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid interview types", () => {
    const types = [
      "phone_screen",
      "technical",
      "behavioral",
      "panel",
      "onsite",
      "other",
    ] as const;
    for (const type of types) {
      const result = interviewFormSchema.safeParse({
        interview_type: type,
        scheduled_date: new Date(),
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("addRoundSchema", () => {
  it("validates same as interviewFormSchema", () => {
    const data = {
      interview_type: "behavioral" as const,
      scheduled_date: new Date("2025-04-01"),
    };
    expect(addRoundSchema.safeParse(data).success).toBe(true);
  });

  it("rejects invalid data", () => {
    expect(addRoundSchema.safeParse({}).success).toBe(false);
  });
});
