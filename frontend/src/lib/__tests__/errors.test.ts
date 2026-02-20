import { AxiosError, AxiosHeaders } from "axios";
import {
  getErrorMessage,
  getErrorDetails,
  isValidationError,
  getFieldErrors,
} from "../errors";

function makeAxiosError(
  status: number,
  data: unknown,
): AxiosError {
  const error = new AxiosError("Request failed");
  error.response = {
    status,
    statusText: "Error",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

function makeNetworkError(): AxiosError {
  const error = new AxiosError("Network Error");
  error.response = undefined;
  return error;
}

describe("getErrorMessage", () => {
  it("maps known error codes to friendly messages", () => {
    const error = makeAxiosError(400, {
      success: false,
      error: { error: "raw", code: "INVALID_CREDENTIALS" },
    });
    expect(getErrorMessage(error)).toBe("Invalid email or password.");
  });

  it("falls back to server error message when code is unknown", () => {
    const error = makeAxiosError(400, {
      success: false,
      error: { error: "Custom server message", code: "UNKNOWN_CODE" },
    });
    expect(getErrorMessage(error)).toBe("Custom server message");
  });

  it("returns network message for AxiosError without response", () => {
    const error = makeNetworkError();
    expect(getErrorMessage(error)).toBe(
      "Connection lost. Please check your network and try again.",
    );
  });

  it("maps 401 status to unauthorized", () => {
    const error = makeAxiosError(401, {});
    expect(getErrorMessage(error)).toBe("Session expired. Please log in again.");
  });

  it("maps 403 status to forbidden", () => {
    const error = makeAxiosError(403, {});
    expect(getErrorMessage(error)).toBe(
      "You don't have access to this resource.",
    );
  });

  it("maps 404 status to not found", () => {
    const error = makeAxiosError(404, {});
    expect(getErrorMessage(error)).toBe("The requested item was not found.");
  });

  it("maps 500+ status to server error", () => {
    const error = makeAxiosError(502, {});
    expect(getErrorMessage(error)).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("handles plain Error instances", () => {
    expect(getErrorMessage(new Error("Something broke"))).toBe(
      "Something broke",
    );
  });

  it("handles Error with Network Error message", () => {
    expect(getErrorMessage(new Error("Network Error"))).toBe(
      "Connection lost. Please check your network and try again.",
    );
  });

  it("returns fallback for unknown types", () => {
    expect(getErrorMessage("string error")).toBe(
      "Something went wrong. Please try again.",
    );
    expect(getErrorMessage(null)).toBe(
      "Something went wrong. Please try again.",
    );
  });
});

describe("getErrorDetails", () => {
  it("extracts details array from response", () => {
    const error = makeAxiosError(400, {
      success: false,
      error: { error: "bad", code: "BAD_REQUEST", details: ["field1 invalid"] },
    });
    expect(getErrorDetails(error)).toEqual(["field1 invalid"]);
  });

  it("returns undefined for non-Axios errors", () => {
    expect(getErrorDetails(new Error("oops"))).toBeUndefined();
  });

  it("returns undefined when no details present", () => {
    const error = makeAxiosError(400, {
      success: false,
      error: { error: "bad", code: "BAD_REQUEST" },
    });
    expect(getErrorDetails(error)).toBeUndefined();
  });
});

describe("isValidationError", () => {
  it("returns true for VALIDATION_FAILED with field_errors", () => {
    const error = makeAxiosError(400, {
      success: false,
      error: {
        error: "validation",
        code: "VALIDATION_FAILED",
        field_errors: { email: "required" },
      },
    });
    expect(isValidationError(error)).toBe(true);
  });

  it("returns false without field_errors", () => {
    const error = makeAxiosError(400, {
      success: false,
      error: { error: "validation", code: "VALIDATION_FAILED" },
    });
    expect(isValidationError(error)).toBe(false);
  });

  it("returns false for non-Axios errors", () => {
    expect(isValidationError(new Error("oops"))).toBe(false);
  });

  it("returns false for network errors", () => {
    expect(isValidationError(makeNetworkError())).toBe(false);
  });
});

describe("getFieldErrors", () => {
  it("returns field_errors map", () => {
    const error = makeAxiosError(400, {
      success: false,
      error: {
        error: "validation",
        code: "VALIDATION_FAILED",
        field_errors: { email: "invalid", name: "too short" },
      },
    });
    expect(getFieldErrors(error)).toEqual({
      email: "invalid",
      name: "too short",
    });
  });

  it("returns undefined for non-Axios errors", () => {
    expect(getFieldErrors(new Error("oops"))).toBeUndefined();
  });
});
