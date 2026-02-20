import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApplicationForm from "../add-application-form";

const mockPush = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/errors", () => ({
  isValidationError: () => false,
  getFieldErrors: () => null,
}));

jest.mock("@/lib/file-service", () => ({
  getPresignedUploadUrl: jest.fn(),
  uploadToS3: jest.fn(),
  confirmUpload: jest.fn(),
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const MockComponent = () => <div data-testid="rich-text-editor" />;
    return MockComponent;
  },
}));

jest.mock("../url-import", () => ({
  __esModule: true,
  default: () => <div data-testid="url-import" />,
}));

jest.mock("../company-autocomplete", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    error,
  }: {
    value: { name: string };
    onChange: (val: { name: string }) => void;
    error?: string;
  }) => (
    <div>
      <label htmlFor="mock-company">Company</label>
      <input
        id="mock-company"
        value={value?.name || ""}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      {error && <p role="alert">{error}</p>}
    </div>
  ),
}));

jest.mock("@/components/file-upload", () => ({
  FileUpload: () => <div data-testid="file-upload" />,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
}));

describe("ApplicationForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with required fields", () => {
    render(<ApplicationForm />);
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
  });

  it("renders submit and cancel buttons", () => {
    render(<ApplicationForm />);
    expect(
      screen.getByRole("button", { name: /save application/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel/i }),
    ).toBeInTheDocument();
  });

  it("submit button is disabled when required fields are empty", () => {
    render(<ApplicationForm />);
    expect(
      screen.getByRole("button", { name: /save application/i }),
    ).toBeDisabled();
  });

  it("enables submit button when required fields are filled", async () => {
    const user = userEvent.setup();
    render(<ApplicationForm />);

    await user.type(screen.getByLabelText(/company/i), "Test Company");
    await user.type(screen.getByLabelText(/position/i), "Software Engineer");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save application/i }),
      ).not.toBeDisabled();
    });
  });

  it("calls API with form data on valid submission", async () => {
    mockPost.mockResolvedValue({ data: { data: { id: "123" } } });
    const user = userEvent.setup();
    render(<ApplicationForm />);

    await user.type(screen.getByLabelText(/company/i), "Test Company");
    await user.type(screen.getByLabelText(/position/i), "Software Engineer");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save application/i }),
      ).not.toBeDisabled();
    });

    await user.click(
      screen.getByRole("button", { name: /save application/i }),
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/api/applications/quick-create",
        expect.objectContaining({
          company_name: "Test Company",
          title: "Software Engineer",
        }),
      );
    });
  });

  it("navigates to /applications on successful creation", async () => {
    mockPost.mockResolvedValue({ data: { data: { id: "123" } } });
    const user = userEvent.setup();
    render(<ApplicationForm />);

    await user.type(screen.getByLabelText(/company/i), "Test Company");
    await user.type(screen.getByLabelText(/position/i), "Software Engineer");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save application/i }),
      ).not.toBeDisabled();
    });

    await user.click(
      screen.getByRole("button", { name: /save application/i }),
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/applications");
    });
  });

  it("cancel button navigates to /applications", async () => {
    const user = userEvent.setup();
    render(<ApplicationForm />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockPush).toHaveBeenCalledWith("/applications");
  });

  it("renders in edit mode with initial data and Update button", () => {
    render(
      <ApplicationForm
        mode="edit"
        applicationId="123"
        initialData={{
          company: { name: "Existing Company" },
          position: "Senior Engineer",
        }}
      />,
    );

    expect(screen.getByLabelText(/company/i)).toHaveValue("Existing Company");
    expect(screen.getByLabelText(/position/i)).toHaveValue("Senior Engineer");
    expect(
      screen.getByRole("button", { name: /update/i }),
    ).toBeInTheDocument();
  });

  it("calls PUT on edit mode submission", async () => {
    mockPut.mockResolvedValue({ data: { data: {} } });
    const user = userEvent.setup();
    render(
      <ApplicationForm
        mode="edit"
        applicationId="456"
        initialData={{
          company: { name: "Test Co" },
          position: "Engineer",
        }}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /update/i }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        "/api/applications/456",
        expect.objectContaining({
          company_name: "Test Co",
          title: "Engineer",
        }),
      );
    });
  });
});
