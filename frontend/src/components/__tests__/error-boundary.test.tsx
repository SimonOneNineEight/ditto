import React from "react";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../error-boundary";

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.queryByText("Child content")).not.toBeInTheDocument();
    expect(screen.getByTestId("error-boundary-fallback")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(
        "An unexpected error occurred. Try refreshing the page.",
      ),
    ).toBeInTheDocument();
  });

  it("renders a refresh button", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("error-boundary-refresh")).toBeInTheDocument();
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });
});
