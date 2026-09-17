export type scheme = {
    // The two data series
    s1: series;
    s2: series;

    // The time series that s1/s2 are built upon
    time: number[];
};

export type series = {
    processed: number[]; // Processed points

    // Per-series stats
    amplitude: number;
    phase: number;
    offset: number;
    error: number;
};
