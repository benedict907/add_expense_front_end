import type { ComponentType, InputHTMLAttributes } from "react";

export function toNumber(value: unknown): number;

type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
  quickAdjust?: number[];
  /** CSS colour for the ₹ symbol and focus accent. */
  accent?: string;
};

declare const MoneyInput: ComponentType<MoneyInputProps>;
export default MoneyInput;
