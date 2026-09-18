import { FrameView } from "./frameView.js";
import { Panel } from "./panel.js";
import { scheme } from "./scheme.js";

// Frame view
const fv = new FrameView(document.querySelector(".frame-view")!, 10000);

// Panels
const p1 = new Panel(document.querySelector<HTMLElement>("#section-1")!);
const p2 = new Panel(document.querySelector<HTMLElement>("#section-2")!);

// Establish socket connection
const portStr = new URLSearchParams(window.location.search).get("p") ?? "NaN";
const port = isNaN(+portStr) ? 5150 : +portStr;

function connect() {
    const socket = new WebSocket(`ws://${window.location.hostname}:${port}`);

    // Show socket state to user
    socket.onerror = (ev: Event) => {
        fv.element.classList.add("error");
        fv.element.classList.remove("open");
    };
    socket.onopen = (ev: Event) => {
        fv.element.classList.remove("error");
        fv.element.classList.add("open");
    };

    // Attempt to reconnect after 1s
    socket.onclose = (ev: CloseEvent) => {
        setTimeout(() => {
            connect();
        }, 1000);
    };

    socket.onmessage = onmessage;
}
connect();

function onmessage(ev: MessageEvent) {
    if (!fv.pushFrame()) return;

    let data: scheme;
    try {
        data = JSON.parse(ev.data);
    } catch (err) {
        // Ignore invalid data...
        console.error("Failed to parse packet...");
        return;
    }

    // Render each plot staggered to avoid one slow frame
    if (staggeredRenderCt === 0) stepStaggeredRender(data);
    staggeredRenderCt = 0;

    // Render data counts immediately (low frame-budget cost)
    p1.stat([
        ["Frequency (rad/s)", data.b.freq],
        ["Phase (rad)", data.b.phase],
        ["Amplitude", data.b.amp],
        ["Offset", data.b.offset],
        ["Error", data.b.error],
    ]);
    p2.stat([
        ["Frequency (rad/s)", data.a.freq],
        ["Phase (rad)", data.a.phase],
        ["Amplitude", data.a.amp],
        ["Offset", data.a.offset],
        ["Error", data.a.error],
    ]);
}

let staggeredRenderCt = 0;
function staggeredRender(data: scheme) {
    switch (staggeredRenderCt) {
        case 0:
            p1.plot(data.time, data.raw, data.b.synthesized);

            stepStaggeredRender(data, 250, true);
            break;
        case 1:
            p2.plot(data.time, data.raw, data.a.synthesized);
            staggeredRenderCt = 0; // Reset
            break;
    }
}

function stepStaggeredRender(data: scheme, delay = 0, increment = false) {
    if (increment) staggeredRenderCt++;

    if (delay === 0) {
        requestAnimationFrame(staggeredRender.bind(null, data));
    } else {
        setTimeout(stepStaggeredRender.bind(null, data, 0, false), delay);
    }
}
