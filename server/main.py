import time
import numpy as np
import io
from dataclasses import asdict
import json
from process import processA, processB
from evaluator import evaluate
from uMail import UMail2Rx

rootDir = "/tmp/mailbox"
prefix = "t"

def main():

    mailbox = UMail2Rx(rootDir, prefix, onRx)

    # Keep running until stopped
    try:
        while (True):
            time.sleep(1)
    finally:
        mailbox.destroy()

def onRx(s):
    data = np.loadtxt(io.StringIO(s), dtype=np.dtype([("time", float), ("value", float)]), delimiter=",")

    # Process data into all base params of sine wave
    processedA = processA(data) # Run method A
    processedB = processB(data) # Run method B

    evaluatedA = evaluate(data, processedA)
    evaluatedB = evaluate(data, processedB)

    payload = {
        "time": data["time"].tolist(),
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

    print(jsonPayload)


if (__name__ == "__main__"):
    main()