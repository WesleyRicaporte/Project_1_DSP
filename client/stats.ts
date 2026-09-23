export function mean(values: number[]): number {
    let total = 0;
    for (const v of values) {
        total += v;
    }
    return total / values.length;
}

export function stdev(values: number[]): number {
    const m = mean(values);

    let total = 0;
    for (const v of values) {
        total += Math.pow(v - m, 2);
    }
    return Math.sqrt(total / values.length);
}
