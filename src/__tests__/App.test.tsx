import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";
import { describe, it, beforeEach, expect, vi } from "vitest";

const mockPush = vi.fn(() => Promise.resolve({ key: "test-key" }));
const mockOnValue = vi.fn((_ref, callback) => {
  callback({ val: () => true });
  return () => {};
});

vi.mock("firebase/database", () => ({
  ref: vi.fn(() => ({})),
  push: (...args: unknown[]) => mockPush(...args),
  onValue: mockOnValue,
}));

vi.mock("../firebase", () => ({
  firebaseDb: {},
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockResolvedValue({ key: "test-key" });
    mockOnValue.mockImplementation((_ref: unknown, callback: (snap: { val: () => boolean }) => void) => {
      callback({ val: () => true });
      return () => {};
    });
  });

  it("renders the form with initial values", () => {
    render(<App />);
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Expense/i })).toBeInTheDocument();
  });

  it("shows alert if required fields are missing", () => {
    window.alert = vi.fn();
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: "0" } });
    fireEvent.submit(screen.getByRole("button", { name: /Add Expense/i }));
    expect(window.alert).toHaveBeenCalledWith("Please fill all fields correctly");
  });

  it("submits the form and resets on success", async () => {
    window.alert = vi.fn();
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Lunch" } });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "MISC" } });
    fireEvent.submit(screen.getByRole("button", { name: /Add Expense/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Expense added successfully!");
    });
  });

  it("shows error alert if push fails", async () => {
    window.alert = vi.fn();
    mockPush.mockRejectedValueOnce(new Error("Network error"));
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Dinner" } });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: "200" } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "MISC" } });
    fireEvent.submit(screen.getByRole("button", { name: /Add Expense/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Network error");
    });
  });

  it("handles input changes correctly", () => {
    render(<App />);
    const descInput = screen.getByLabelText(/Description/i) as HTMLInputElement;
    const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;

    fireEvent.change(descInput, { target: { value: "Groceries" } });
    expect(descInput.value).toBe("Groceries");

    fireEvent.change(amountInput, { target: { value: "50" } });
    expect(amountInput.value).toBe("50");
  });
});
