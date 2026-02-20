import { interviewerSchema, interviewerFormSchema } from "../interviewer";

describe("interviewerSchema", () => {
  it("validates with name only", () => {
    expect(interviewerSchema.safeParse({ name: "Jane Doe" }).success).toBe(
      true,
    );
  });

  it("validates with name and role", () => {
    const result = interviewerSchema.safeParse({
      name: "Jane Doe",
      role: "Engineering Manager",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(interviewerSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects name over 255 characters", () => {
    expect(
      interviewerSchema.safeParse({ name: "a".repeat(256) }).success,
    ).toBe(false);
  });

  it("rejects role over 255 characters", () => {
    const result = interviewerSchema.safeParse({
      name: "Jane",
      role: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });
});

describe("interviewerFormSchema", () => {
  it("validates array with one interviewer", () => {
    const result = interviewerFormSchema.safeParse({
      interviewers: [{ name: "Jane Doe" }],
    });
    expect(result.success).toBe(true);
  });

  it("validates array with multiple interviewers", () => {
    const result = interviewerFormSchema.safeParse({
      interviewers: [
        { name: "Jane Doe", role: "Manager" },
        { name: "John Smith", role: "Tech Lead" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = interviewerFormSchema.safeParse({ interviewers: [] });
    expect(result.success).toBe(false);
  });
});
