import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the server action so importing the page doesn't pull in server-only modules.
const { signUpAction } = vi.hoisted(() => ({ signUpAction: vi.fn() }));
vi.mock("../actions", () => ({ signUpAction }));

import RegisterPage from "./page";

describe("RegisterPage", () => {
  beforeEach(() => signUpAction.mockReset());

  it("blocks submission and shows an error when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(signUpAction).not.toHaveBeenCalled();
  });

  it("submits normalized values to signUpAction when the form is valid", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "Ada@Example.com");
    await user.type(screen.getByLabelText(/password/i), "password1");
    await user.type(screen.getByLabelText(/age/i), "30");
    await user.selectOptions(screen.getByLabelText(/sex/i), "female");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(signUpAction).toHaveBeenCalledTimes(1));
    expect(signUpAction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ada", email: "ada@example.com", age: 30, sex: "female" }),
    );
  });
});
