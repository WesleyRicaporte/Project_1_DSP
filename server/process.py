import numpy as np
from cosdesc import CosDesc

# Run process A (control) to estimate parameters
def processA(data: np.ndarray) -> CosDesc:
    return CosDesc(1, 0, 1, 1) # Demo...

# Run process B (DUT) to estimate parameters
def processB(data: np.ndarray) -> CosDesc:
    return CosDesc(1, 0, 0, 1) # Demo...
