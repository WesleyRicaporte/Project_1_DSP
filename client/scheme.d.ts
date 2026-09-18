export type scheme = {
    time: number[];
    raw: number[];

    // The two data series
    a: series;
    b: series;

    // The time series that s1/s2 are built upon
};

export type series = {
    error: number;

    synthesized: number[]; // Processed points

    // Per-series stats
    amp: number;
    offset: number;
    phase: number;
    freq: number;
};
