import { questionSchema, questionFormSchema } from "../question";

describe("questionSchema", () => {
  it("validates with question_text only", () => {
    const result = questionSchema.safeParse({
      question_text: "What is a closure?",
    });
    expect(result.success).toBe(true);
  });

  it("validates with question and answer", () => {
    const result = questionSchema.safeParse({
      question_text: "What is a closure?",
      answer_text: "A function that captures its lexical scope",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty question_text", () => {
    expect(questionSchema.safeParse({ question_text: "" }).success).toBe(false);
  });

  it("rejects question_text over 5000 characters", () => {
    const result = questionSchema.safeParse({
      question_text: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects answer_text over 5000 characters", () => {
    const result = questionSchema.safeParse({
      question_text: "Question?",
      answer_text: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});

describe("questionFormSchema", () => {
  it("validates with one question", () => {
    const result = questionFormSchema.safeParse({
      questions: [{ question_text: "Tell me about yourself" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty questions array", () => {
    expect(questionFormSchema.safeParse({ questions: [] }).success).toBe(false);
  });
});
