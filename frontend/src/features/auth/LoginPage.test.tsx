import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";
import type { User } from "../../types/inventory";

const user: User = {
  id: "u1",
  name: "Alex Morgan",
  email: "alex@adb.org",
  role: "Store room officer",
  currentStoreName: "IT Store Room",
  permissions: ["inventory:read", "movement:read", "movement:create"],
};

describe("LoginPage", () => {
  it("validates the email before submitting", async () => {
    const onLogin = vi.fn().mockResolvedValue(user);
    const actor = userEvent.setup();
    render(<LoginPage onLogin={onLogin} />);

    await actor.type(screen.getByLabelText("Work email"), "not-an-email");
    await actor.type(screen.getByLabelText("Password"), "password");
    await actor.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Enter a valid work email")).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("shows a sign-in failure without swallowing it", async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error("Sign-in unavailable"));
    const actor = userEvent.setup();
    render(<LoginPage onLogin={onLogin} />);

    await actor.type(screen.getByLabelText("Work email"), "alex@adb.org");
    await actor.type(screen.getByLabelText("Password"), "password");
    await actor.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign-in unavailable");
  });
});
