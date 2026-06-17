import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("confirm", vi.fn(() => false));
    vi.stubGlobal("alert", vi.fn());
  });

  it("renders main navigation and default calculator tab", () => {
    render(<App />);

    expect(screen.getByRole("navigation", { name: /main sections/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /baseline calculator/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tabpanel", { name: /baseline calculator/i })).toBeInTheDocument();
    expect(screen.getByText(/Lifestyle Baseline Assessment/i)).toBeInTheDocument();
  });

  it("switches to daily logs tab when selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /daily green logs/i }));

    expect(screen.getByRole("tab", { name: /daily green logs/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText(/Daily Action Logger/i)).toBeInTheDocument();
  });

  it("displays net carbon metric with accessible label", () => {
    render(<App />);

    expect(screen.getByRole("img", { name: /net annual carbon footprint/i })).toBeInTheDocument();
  });
});
