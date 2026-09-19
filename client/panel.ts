import Plotly, { PlotlyDataLayoutConfig } from "plotly.js-dist-min";

const statTemplate = document
    .querySelector<HTMLTemplateElement>("#stat-template")!
    .content.querySelector<HTMLElement>(".stat")!;

export class Panel {
    readonly element: HTMLElement;
    private readonly root: HTMLElement;
    private readonly stats: HTMLElement;

    /** Historical stat values */
    private readonly history = new Map<string, number[]>();

    private readonly promises = new Map<
        HTMLElement,
        {
            promise: Promise<any>;
            queued?: [
                data: Plotly.Data[],
                layout?: Partial<Plotly.Layout>,
                config?: Partial<Plotly.Config>,
            ];
        }
    >();

    constructor(element: HTMLElement) {
        this.element = element;
        this.root = element.querySelector(".chart")!;
        this.stats = element.querySelector(".stats")!;
    }

    /**
     * Plot points (uninterpolated => raw)
     * @param time      Time series
     * @param points    Amplitudes that make up data
     */
    plot(time: number[], points: number[], line: number[]) {
        const data: Plotly.Data[] = [
            {
                type: "scattergl",
                mode: "markers",
                x: time,
                y: points,
                marker: {
                    size: 4,
                },
                name: "Raw",
            },
            {
                type: "scattergl",
                mode: "line",
                x: time,
                y: line,
                name: "Synth",
            },
        ];

        // Throttle performance while not actively in use
        if (document.hidden === true) return;

        this.render(this.root, data, Panel.layout, Panel.config);
    }

    /**
     * Update stats data
     * @param stats
     */
    stat(stats: [name: string, value: number | string][]) {
        const children = this.stats.children;

        let layoutChanged = false;
        const charts: HTMLElement[] = [];

        // Remove any extra child entries
        for (let i = children.length - 1; i >= stats.length; i--) {
            children[i].remove();
            layoutChanged = true;
        }

        for (const [i, [name, v]] of Object.entries(stats)) {
            // Format value as needed
            const value = typeof v === "number" ? v.toPrecision(4) : v;

            let child = children[+i] as HTMLDivElement;
            // Need to create a new child
            if (!child) {
                child = statTemplate.cloneNode(true) as HTMLDivElement;
                this.stats.append(child);
                layoutChanged = true;
            }

            // Need to update label
            if (child.dataset.name !== name) {
                child.querySelector(".stat-label")!.textContent = name;
                child.dataset.name = name;
            }

            // Update value
            child.querySelector(".stat-value")!.textContent = value;

            // Non-numeric value; Nothing more to do!
            if (isNaN(+value)) continue;

            // Update background graph

            // Push to history
            const history = this.history.getOrInsert(name, []);
            history.push(+value);

            if (history.length > Panel.MAX_HISTORY) {
                history.splice(0, history.length - Panel.MAX_HISTORY); // Remove all extras
            }

            const data: Plotly.Data[] = [
                {
                    type: "scatter",
                    mode: "lines",
                    x: history.map((_, i) => i),
                    y: history,
                },
            ];

            const chart = child.querySelector<HTMLElement>(".stat-plot")!;
            charts.push(chart);

            this.render(chart, data, Panel.miniLayout, Panel.miniConfig);
        }

        if (layoutChanged) {
            for (const chart of charts) {
                Plotly.Plots.resize(chart);
            }
            Plotly.Plots.resize(this.root);
        }
    }

    private render(
        element: HTMLElement,
        data: Plotly.Data[],
        layout?: Partial<Plotly.Layout>,
        config?: Partial<Plotly.Config>,
    ) {
        if (this.promises.has(element)) {
            this.promises.get(element)!.queued = [data, layout, config];
            return;
        }

        // Track plotly plot
        const promise = Plotly.react(element, data, layout, config);
        this.promises.set(element, { promise });

        // Remove self from tracking, then run any backlogged events
        promise.finally(() => {
            const queued = this.promises.get(element)?.queued;
            this.promises.delete(element);

            // Run queued event
            if (queued) {
                this.render(element, ...queued);
            }
        });
    }

    static layout: Partial<Plotly.Layout> = {
        uirevision: "main",

        xaxis: {
            title: {
                text: "Time (s)",
            },
        },
        yaxis: {
            title: {
                text: "Amplitude",
            },
        },

        margin: {
            autoexpand: true,
            t: 0,
        },

        legend: {
            visible: false,
        },

        modebar: {
            remove: ["select2d", "lasso2d", "sendChartToCloud"],
        },
    };

    static config: Partial<Plotly.Config> = {
        responsive: true,
        displaylogo: false,
        staticPlot: false,
    };

    static miniLayout: Partial<Plotly.Layout> = {
        margin: {
            autoexpand: true,
            t: 0,
            b: 0,
            l: 50,
            r: 0,
        },
        xaxis: {
            visible: false,
        },
    };

    static miniConfig: Partial<Plotly.Config> = {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
        staticPlot: false,
    };

    static MAX_HISTORY = 50;
}
