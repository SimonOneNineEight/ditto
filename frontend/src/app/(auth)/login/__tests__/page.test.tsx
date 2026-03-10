import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../page";

const mockPush = jest.fn();
const mockSignIn = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

jest.mock("../../components/market-banner", () => ({
  __esModule: true,
  default: () => <div data-testid="market-banner" />,
}));

jest.mock("../../components/oauth-buttons", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="oauth-buttons">
      <button>Continue with GitHub</button>
      <button>Continue with Google</button>
    </div>
  ),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders sign in button and OAuth section", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("oauth-buttons")).toBeInTheDocument();
  });

  it("renders sign up link pointing to /register", () => {
    render(<LoginPage />);
    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("shows validation error for invalid email on submit", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "password123");
    // fireEvent.submit bypasses HTML5 constraint validation on type="email"
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows validation error for short password on submit", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("calls signIn with credentials on valid submission", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
        callbackUrl: "/",
      });
    });
  });

  it("redirects to / on successful login", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows error message on failed login", async () => {
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Invalid email or password"),
      ).toBeInTheDocument();
    });
  });

  it("passes valid internal callbackUrl from URL params to signIn", async () => {
    mockSearchParams = new URLSearchParams("callbackUrl=/applications");
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
        callbackUrl: "/applications",
      });
      expect(mockPush).toHaveBeenCalledWith("/applications");
    });
  });

  it("sanitizes external callbackUrl to / to prevent open redirect", async () => {
    mockSearchParams = new URLSearchParams("callbackUrl=//evil.com");
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
        callbackUrl: "/",
      });
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("sanitizes absolute external callbackUrl to /", async () => {
    mockSearchParams = new URLSearchParams("callbackUrl=https://evil.com");
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
        callbackUrl: "/",
      });
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows session expired message when error=SessionExpired in URL", () => {
    mockSearchParams = new URLSearchParams("error=SessionExpired&callbackUrl=/applications");
    render(<LoginPage />);

    expect(
      screen.getByText("Your session has expired. Please sign in again."),
    ).toBeInTheDocument();
  });
});
