import Plotly from "plotly.js-dist-min";

const statTemplate = document
    .querySelector<HTMLTemplateElement>("#stat-template")!
    .content.querySelector<HTMLElement>(".stat")!;

export class Panel {
    readonly element: HTMLElement;
    private readonly root: HTMLElement;
    private readonly stats: HTMLElement;

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
        Plotly.react(this.root, data, Panel.layout, Panel.config);
    }

    /**
     * Update stats data
     * @param stats
     */
    stat(stats: [name: string, value: number | string][]) {
        const children = this.stats.children;

        // Remove any extra child entries
        for (let i = children.length - 1; i >= stats.length; i--) {
            children[i].remove();
        }

        for (const [i, [name, v]] of Object.entries(stats)) {
            // Format value as needed
            const value = typeof v === "number" ? v.toPrecision(4) : v;

            let child = children[+i] as HTMLDivElement;
            // Need to create a new child
            if (!child) {
                child = statTemplate.cloneNode(true) as HTMLDivElement;
                this.stats.append(child);
            }

            // Need to update label
            if (child.dataset.name !== name) {
                child.querySelector(".stat-label")!.textContent = name;
                child.dataset.name = name;
            }

            // Update value
            child.querySelector(".stat-value")!.textContent = value;
        }
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
    };
}
