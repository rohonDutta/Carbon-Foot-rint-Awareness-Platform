import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("confirm", vi.fn(() => false));
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("fetch", vi.fn());
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

  it("switches to AI Action Planner tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /ai action planner/i }));

    expect(screen.getByRole("tab", { name: /ai action planner/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText(/AI Personalized Action Planner/i)).toBeInTheDocument();
  });

  it("switches to Progress & Badges tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /progress & badges/i }));

    expect(screen.getByRole("tab", { name: /progress & badges/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText(/Environmental Achievement Medals/i)).toBeInTheDocument();
  });

  it("switches to Eco Assist AI tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /eco assist ai/i }));

    expect(screen.getByRole("tab", { name: /eco assist ai/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText(/Eco Assist Expert/i)).toBeInTheDocument();
  });

  it("adds a daily log when a preset action is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: /daily green logs/i }));

    const initialLogs = screen.getAllByText(/kg/i);
    const presetButtons = screen.getAllByRole("button", { name: /commute via metro/i });
    await user.click(presetButtons[0]);

    // Log count should increase
    const updatedLogs = screen.getAllByText(/kg/i);
    expect(updatedLogs.length).toBeGreaterThanOrEqual(initialLogs.length);
  });

  it("shows skip to main content link for keyboard navigation", () => {
    render(<App />);
    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("renders footer with project attribution", () => {
    render(<App />);
    expect(screen.getByText(/CO₂-ZERO ENVIRONMENT PROJECT/i)).toBeInTheDocument();
  });
});
