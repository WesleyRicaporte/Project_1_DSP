import numpy as np
import math
from cosdesc import CosDesc

"""
Input `data` arrays expected to have the following columns:
- time
- value
"""

# Run process A (control) to estimate parameters
# Direct 1:1 replica of MATLAB code in Python
def processA(data: np.ndarray) -> CosDesc:

    # Control estimation strategy
    # Relies on knowing the signal frequency
    fsignal = 1     # Signal frequency (Hz)

    t = data["time"]

    # Compute sampling frequency from first two time samples
    fsample = 1 / (t[1] - t[0])

    # Create discrete time series
    tn = np.arange(0, len(t)) * (1 / fsample)

    # Convert fsignal from Hz to rad/s
    w0 = 2 * math.pi * fsignal

    # Create transformation matrix of the shape (3 x 1024)
    E = np.array([
        np.cos(w0 * tn),
        np.sin(w0 * tn),
        np.ones(len(tn))
    ]).transpose()
    psuedo_E = np.linalg.pinv(E)

    # Multiply matricies to get final values
    alpha, beta, offset = psuedo_E @ data["value"]

    amp = np.sqrt(np.square(alpha) + np.square(beta))
    phase = np.atan2(beta, alpha)

    return CosDesc(amp, offset, phase, w0)

# Run process B (DUT) to estimate parameters
def processB(data: np.ndarray) -> CosDesc:
    return CosDesc(1, 0, 0, 1) # Demo...
