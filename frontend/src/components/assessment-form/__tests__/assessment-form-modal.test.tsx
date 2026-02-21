import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssessmentFormModal } from "../assessment-form-modal";

const mockCreateAssessment = jest.fn();

jest.mock("@/services/assessment-service", () => ({
  createAssessment: (...args: unknown[]) => mockCreateAssessment(...args),
  ASSESSMENT_TYPE_OPTIONS: [
    { value: "take_home_project", label: "Take Home Project" },
    { value: "live_coding", label: "Live Coding" },
    { value: "system_design", label: "System Design" },
    { value: "data_structures", label: "Data Structures" },
    { value: "case_study", label: "Case Study" },
    { value: "other", label: "Other" },
  ],
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/errors", () => ({
  isValidationError: () => false,
  getFieldErrors: () => null,
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
  }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogBody: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/ui/select", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require("react");
  const Ctx = R.createContext<{
    onValueChange?: (v: string) => void;
    disabled?: boolean;
  }>({});

  return {
    Select: ({
      children,
      onValueChange,
      disabled,
    }: {
      children: React.ReactNode;
      onValueChange: (v: string) => void;
      value?: string;
      disabled?: boolean;
    }) => (
      <Ctx.Provider value={{ onValueChange, disabled }}>
        <div>{children}</div>
      </Ctx.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => {
      const ctx = R.useContext(Ctx);
      return (
        <div
          role="option"
          aria-selected={false}
          onClick={() => ctx.onValueChange?.(value)}
        >
          {children}
        </div>
      );
    },
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder}</span>
    ),
  };
});

jest.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({
    value,
    onChange,
    id,
  }: {
    value?: Date;
    onChange: (d: Date) => void;
    id?: string;
  }) => (
    <input
      type="date"
      id={id}
      data-testid={id || "date-picker"}
      value={value ? value.toISOString().split("T")[0] : ""}
      onChange={(e) => onChange(new Date(e.target.value + "T12:00:00"))}
    />
  ),
}));

describe("AssessmentFormModal", () => {
  const defaultProps = {
    applicationId: "app-1",
    open: true,
    onOpenChange: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders dialog with title", () => {
    render(<AssessmentFormModal {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /add assessment/i }),
    ).toBeInTheDocument();
  });

  it("renders assessment type options", () => {
    render(<AssessmentFormModal {...defaultProps} />);
    expect(screen.getByText("Take Home Project")).toBeInTheDocument();
    expect(screen.getByText("Live Coding")).toBeInTheDocument();
    expect(screen.getByText("System Design")).toBeInTheDocument();
  });

  it("renders title input and due date picker", () => {
    render(<AssessmentFormModal {...defaultProps} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByTestId("assessment-due-date")).toBeInTheDocument();
  });

  it("renders optional instructions and requirements fields", () => {
    render(<AssessmentFormModal {...defaultProps} />);
    expect(screen.getByLabelText(/instructions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/requirements/i)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<AssessmentFormModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("submit button is disabled until required fields are filled", () => {
    render(<AssessmentFormModal {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /create assessment/i }),
    ).toBeDisabled();
  });

  it("calls createAssessment on valid submission", async () => {
    mockCreateAssessment.mockResolvedValue({
      id: "assess-1",
      application_id: "app-1",
      assessment_type: "take_home_project",
      title: "API Challenge",
      due_date: "2026-03-15",
      status: "not_started",
      created_at: "",
      updated_at: "",
    });
    const user = userEvent.setup();
    render(<AssessmentFormModal {...defaultProps} />);

    // Select assessment type
    await user.click(
      screen.getByRole("option", { name: "Take Home Project" }),
    );

    // Fill title
    await user.type(screen.getByLabelText(/title/i), "API Challenge");

    // Set due date
    fireEvent.change(screen.getByTestId("assessment-due-date"), {
      target: { value: "2026-03-15" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /create assessment/i }),
      ).not.toBeDisabled();
    });

    await user.click(
      screen.getByRole("button", { name: /create assessment/i }),
    );

    await waitFor(() => {
      expect(mockCreateAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          application_id: "app-1",
          assessment_type: "take_home_project",
          title: "API Challenge",
          due_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      );
    });
  });

  it("calls onSuccess and closes dialog after successful creation", async () => {
    const mockAssessment = {
      id: "assess-1",
      application_id: "app-1",
      assessment_type: "take_home_project",
      title: "API Challenge",
      due_date: "2026-03-15",
      status: "not_started",
      created_at: "",
      updated_at: "",
    };
    mockCreateAssessment.mockResolvedValue(mockAssessment);
    const user = userEvent.setup();
    render(<AssessmentFormModal {...defaultProps} />);

    await user.click(
      screen.getByRole("option", { name: "Take Home Project" }),
    );
    await user.type(screen.getByLabelText(/title/i), "API Challenge");
    fireEvent.change(screen.getByTestId("assessment-due-date"), {
      target: { value: "2026-03-15" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /create assessment/i }),
      ).not.toBeDisabled();
    });

    await user.click(
      screen.getByRole("button", { name: /create assessment/i }),
    );

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockAssessment);
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("cancel button calls onOpenChange(false)", async () => {
    const user = userEvent.setup();
    render(<AssessmentFormModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
