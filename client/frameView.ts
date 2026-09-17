/**
 * Render incoming frames of data
 */
export class FrameView {
    private readonly element: HTMLElement;
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly tTotMs: number;

    private animating: boolean = false;
    private paused: boolean = false;

    // Store when events occurred
    private readonly events = new Set<number>();

    constructor(element: HTMLElement, tTotMs: number) {
        const state = element.querySelector<HTMLInputElement>(".frame-state")!;

        state.addEventListener(
            "change",
            this.onPauseStateChanged.bind(this, state),
        );

        this.element = element;
        this.canvas =
            element.querySelector<HTMLCanvasElement>(".frame-view-canvas")!;
        this.ctx = this.canvas.getContext("2d")!;
        this.tTotMs = tTotMs;

        const observer = new ResizeObserver(this.onResize.bind(this));
        observer.observe(element);
    }

    private onPauseStateChanged(state: HTMLInputElement, e: Event) {
        this.paused = state.checked;

        this.kickAnimation();
    }

    private onResize() {
        const bounds = this.element.getBoundingClientRect();

        this.canvas.width = bounds.width;
        this.canvas.height = bounds.height;

        this.render();
    }

    /**
     * Indicate that some frame was just received
     */
    pushFrame() {
        if (this.paused) return;

        // Push new frame event to queue
        this.events.add(new Date().getTime());

        // Start animation loop if required
        this.kickAnimation();
    }

    private kickAnimation() {
        // Need to start animation loop
        if (!this.animating && this.events.size > 0) {
            this.animating = true;
            requestAnimationFrame(this.animate.bind(this));
        }
    }

    /**
     * Main animation loop
     */
    private animate() {
        // Halt!
        if (!this.animating || this.events.size === 0) {
            this.animating = false;
            return;
        }

        // Keep animation loop alive
        requestAnimationFrame(this.animate.bind(this));

        this.render();
    }

    /**
     * Render canvas frame
     */
    private render() {
        const end = new Date().getTime();
        const start = end - this.tTotMs;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const thickness = 20;

        for (const event of this.events) {
            // Event aged out of system...
            if (event < start || event > end) {
                this.events.delete(event);
                continue;
            }

            // Render using LERP
            const n = (event - start) / this.tTotMs;

            const x = Math.floor(
                (this.canvas.width + thickness) * (1 - n) - thickness,
            );

            this.ctx.fillStyle = colorFromNumber(event); // Unique color to help differentiate events
            this.ctx.fillRect(x, 0, 20, this.canvas.height);
        }
    }
}

function colorFromNumber(n: number) {
    const hue = (n * 0.618033988749895) % 1;

    return `hsl(${hue * 360}, 80%, 30%)`;
}
