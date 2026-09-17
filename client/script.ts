import { FrameView } from "./frameView.js";

// Frame view
const fv = new FrameView(document.querySelector(".frame-view")!, 10000);

// Establish socket connection
const portStr = new URLSearchParams(window.location.search).get("p") ?? "NaN";
const port = isNaN(+portStr) ? 5150 : +portStr;

const socket = new WebSocket(`ws://127.0.0.1:${port}`);

socket.onmessage = (ev: MessageEvent) => {
    fv.pushFrame();
    console.log(ev.data);
};

socket.onopen = (ev: Event) => {
    console.log("OPEN", ev);
};
