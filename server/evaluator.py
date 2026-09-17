import numpy as np
from cosdesc import CosDesc
from dataclasses import dataclass

@dataclass
class Evaluated:
    error: np.float64     # Error between original and synthesized signal
    synthesized: list # Synthesized processed data

"""
Evaluate processed data to determine stats on the algorithm used
Expect: `original` contains 2 columns: [time, value]
"""
def evaluate(original: np.ndarray, processed: CosDesc):

    # Synthesize sinusoidal from processed parameters
    synthesized = processed.amp * np.cos(processed.freq * original["time"] - processed.phase) + processed.offset;

    # Compute error
    # Use RMS (sqrt(avg(sq(a - b)))) method

    error: np.float64 = np.sqrt(
        np.mean(
            np.square(
                synthesized - original["value"]
            )
        )
    )

    return Evaluated(error, synthesized.tolist())