import type { ComponentType, SVGProps } from "react";

/** Every icon takes the standard SVG props; size and colour come from the caller. */
export type IconProps = SVGProps<SVGSVGElement>;
type Icon = ComponentType<IconProps>;

export const Wallet: Icon;
export const ArrowDownLeft: Icon;
export const ArrowUpRight: Icon;
export const TrendUp: Icon;
export const TrendDown: Icon;
export const Plus: Icon;
export const Close: Icon;
export const Check: Icon;
export const Trash: Icon;
export const Calendar: Icon;
export const Clock: Icon;
export const Target: Icon;
export const Receipt: Icon;
export const Card: Icon;
export const Basket: Icon;
export const Layers: Icon;
export const Bell: Icon;
export const Copy: Icon;
export const Logout: Icon;
export const Sparkle: Icon;
export const Phone: Icon;
export const Shield: Icon;
export const Chart: Icon;
export const Note: Icon;
export const Alert: Icon;
export const Inbox: Icon;

export function categoryVisual(category?: string): { Icon: Icon; hue: string };
