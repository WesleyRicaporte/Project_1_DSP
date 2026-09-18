import time
import numpy as np
import io
import asyncio
from websockets.asyncio.server import serve, ServerConnection
from dataclasses import asdict
import json
from process import processA, processB
from evaluator import evaluate
from uMail import UMail2Rx

rootDir = "/tmp/mailbox"
prefix = "t"
port = 5150

clients: dict[ServerConnection, bool] = {}
loop: asyncio.AbstractEventLoop = None

async def handler(websocket: ServerConnection):
    clients[websocket] = True # Track self
    print(f"Client connected ({len(clients)})")

    try:
        async for message in websocket:
            pass
    finally:
        del clients[websocket] # Untrack self

        print(f"Client disconnected ({len(clients)})")


async def main():
    global loop
    loop = asyncio.get_running_loop()

    mailbox = UMail2Rx(rootDir, prefix, onRx)
    server = await serve(handler, "127.0.0.1", port)
    await server.serve_forever()

    print("FINISHED")
    mailbox.destroy()

def onRx(s):
    sstream = io.StringIO(s)
    asyncio.run_coroutine_threadsafe(run_processing(sstream), loop)

async def run_processing(sstream: io.StringIO):
    data = np.loadtxt(sstream, dtype=np.dtype([("time", float), ("value", float)]), delimiter=",")

    # Process data into all base params of sine wave
    processedA = processA(data) # Run method A
    processedB = processB(data) # Run method B

    evaluatedA = evaluate(data, processedA)
    evaluatedB = evaluate(data, processedB)

    payload = {
        "time": data["time"].tolist(),
        "raw": data["value"].tolist(),
        "a": {
            **asdict(evaluatedA),
            **asdict(processedA)
        },
        "b": {
            **asdict(evaluatedB),
            **asdict(processedB)
        }
    }

    # Stingify payload for socket transport layer
    jsonPayload = json.dumps(payload)

    # Send to all clients
    for c in clients:
        await c.send(jsonPayload)


if (__name__ == "__main__"):
    asyncio.run(main())
