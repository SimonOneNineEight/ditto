import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterviewFormModal } from "../interview-form-modal";

const mockCreateInterview = jest.fn();

jest.mock("@/services/interview-service", () => ({
  createInterview: (...args: unknown[]) => mockCreateInterview(...args),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/errors", () => ({
  isValidationError: () => false,
  getFieldErrors: () => null,
}));

// Mock Dialog as simple HTML wrappers to avoid Radix portal issues in jsdom
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
  DialogBody: ({
    children,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock Select with clickable options that call onValueChange via context
jest.mock("@/components/ui/select", () => {
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
    SelectTrigger: ({
      children,
    }: {
      children: React.ReactNode;
      id?: string;
    }) => <div>{children}</div>,
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

jest.mock("@/components/ui/time-picker", () => ({
  TimePicker: ({
    value,
    onChange,
    id,
  }: {
    value?: string;
    onChange: (v: string) => void;
    id?: string;
  }) => (
    <input
      type="time"
      id={id}
      data-testid={id || "time-picker"}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe("InterviewFormModal", () => {
  const defaultProps = {
    applicationId: "app-1",
    open: true,
    onOpenChange: jest.fn(),
    onSuccess: jest.fn(),
    currentInterviewCount: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders dialog with title", () => {
    render(<InterviewFormModal {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: /add interview/i }),
    ).toBeInTheDocument();
  });

  it("shows auto-calculated round number", () => {
    render(<InterviewFormModal {...defaultProps} />);
    expect(screen.getByText("Round 3")).toBeInTheDocument();
  });

  it("renders interview type options", () => {
    render(<InterviewFormModal {...defaultProps} />);
    expect(screen.getByText("Phone Screen")).toBeInTheDocument();
    expect(screen.getByText("Technical")).toBeInTheDocument();
    expect(screen.getByText("Behavioral")).toBeInTheDocument();
  });

  it("renders date picker and time picker", () => {
    render(<InterviewFormModal {...defaultProps} />);
    expect(screen.getByTestId("interview-date")).toBeInTheDocument();
    expect(screen.getByTestId("interview-time")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<InterviewFormModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("submit button is disabled until interview type is selected", () => {
    render(<InterviewFormModal {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /add interview/i }),
    ).toBeDisabled();
  });

  it("calls createInterview on valid submission", async () => {
    mockCreateInterview.mockResolvedValue({
      id: "int-1",
      application_id: "app-1",
      round_number: 3,
      interview_type: "technical",
      scheduled_date: "2026-02-19",
      created_at: "",
      updated_at: "",
    });
    const user = userEvent.setup();
    render(<InterviewFormModal {...defaultProps} />);

    // Select interview type
    await user.click(screen.getByRole("option", { name: "Technical" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add interview/i }),
      ).not.toBeDisabled();
    });

    await user.click(
      screen.getByRole("button", { name: /add interview/i }),
    );

    await waitFor(() => {
      expect(mockCreateInterview).toHaveBeenCalledWith(
        expect.objectContaining({
          application_id: "app-1",
          interview_type: "technical",
          scheduled_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      );
    });
  });

  it("calls onSuccess and closes dialog after successful creation", async () => {
    const mockInterview = {
      id: "int-1",
      application_id: "app-1",
      round_number: 3,
      interview_type: "technical",
      scheduled_date: "2026-02-19",
      created_at: "",
      updated_at: "",
    };
    mockCreateInterview.mockResolvedValue(mockInterview);
    const user = userEvent.setup();
    render(<InterviewFormModal {...defaultProps} />);

    await user.click(screen.getByRole("option", { name: "Technical" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add interview/i }),
      ).not.toBeDisabled();
    });

    await user.click(
      screen.getByRole("button", { name: /add interview/i }),
    );

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockInterview);
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("cancel button calls onOpenChange(false)", async () => {
    const user = userEvent.setup();
    render(<InterviewFormModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
