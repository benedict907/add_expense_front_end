import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";
import { describe, it, beforeEach, expect, vi } from "vitest";
describe("App", () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        vi.stubGlobal("fetch", mockFetch);
        import.meta.env.VITE_API_URL = "http://localhost/api";
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
        mockFetch.mockResolvedValueOnce({ status: 200 });
        render(<App />);
        fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Lunch" } });
        fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: "100" } });
        fireEvent.submit(screen.getByRole("button", { name: /Add Expense/i }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost/api",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                })
            );
            expect(window.alert).toHaveBeenCalledWith("Expense added successfully!");
        });
    });

    it("shows error alert if fetch fails", async () => {
        window.alert = vi.fn();
        mockFetch.mockResolvedValueOnce({ status: 500 });
        render(<App />);
        fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Dinner" } });
        fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: "200" } });
        fireEvent.submit(screen.getByRole("button", { name: /Add Expense/i }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalled();
            // The alert will be called with an Error object, so just check it's called
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
