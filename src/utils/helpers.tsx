

type Color = { red: number,green: number,blue: number };

export const isCompleted = (color?: Color) => {
    return color?.red !== 1;
};