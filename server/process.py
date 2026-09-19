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
    fsignal = 1000    # Signal frequency (Hz)

    t = data["time"]

    # Convert fsignal from Hz to rad/s
    w0 = 2 * math.pi * fsignal

    # Create transformation matrix of the shape (3 x 1024)
    E = np.array([
        np.cos(w0 * t),
        np.sin(w0 * t),
        np.ones(len(t))
    ]).transpose()
    psuedo_E = np.linalg.pinv(E)

    # Multiply matricies to get final values
    alpha, beta, offset = psuedo_E @ data["value"]

    amp = np.sqrt(np.square(alpha) + np.square(beta))
    phase = np.atan2(beta, alpha)

    return CosDesc(amp, offset, phase, w0)

def processB(data: np.ndarray) -> CosDesc:
    t = data["time"]
    value = data["value"]

    # Compute sampling frequency from first two time samples
    fsample = 1 / (t[1] - t[0])

    fft = np.fft.fft(value)

    # Search for max freq.
    maxI = 0
    maxM = 0
    for i in range(0, int(len(fft) / 2)):
        mag = np.abs(fft[i])
        if (mag > maxM):
            maxM = mag
            maxI = i

    # Only care about frequencies maxI - 1, maxI, maxI + 1
    # Create mask to zero-out all others
    mask = np.zeros(len(fft))

    for i in range(-1, 2):
        if (maxI + i >= 0 and maxI + i < len(mask)):

            # Apply mask to both bottom AND top of FFT range
            # Handles aliasing
            mask[maxI + i] = 1
            mask[len(fft) - (maxI + i)] = 1

    filt_fft = fft * mask
    filt_sig = np.fft.ifft(filt_fft)

    # Find **upwards** zero crossings
    zeroes: list[float] = []
    for i in range(1, len(filt_sig)):
        a = np.real(filt_sig[i - 1])
        b = np.real(filt_sig[i])

        if ((a < 0) and (b >= 0)):

            # LERP between a_i and b_i to find straight-line-approximation of zero-crossing point
            zeroes.append(float(-b / (b - a)) + i)

    # Find average period between zero crossings
    # Strat: MEAN
    Tz = (zeroes[-1] - zeroes[0]) / (len(zeroes) - 1)

    Tz_freq = Tz / fsample

    # 1x zero crossings per cycle
    # => T0 = Tz
    T = Tz_freq

    # Freq from fft max index
    fsignal = 1 / T

    # Convert fsignal from Hz to rad/s
    w0 = 2 * math.pi * fsignal

    # Create transformation matrix of the shape (3 x 1024)
    E = np.array([
        np.cos(w0 * t),
        np.sin(w0 * t),
        np.ones(len(t))
    ]).transpose()
    psuedo_E = np.linalg.pinv(E)

    # Multiply matricies to get final values
    alpha, beta, offset = psuedo_E @ data["value"]

    amp = np.sqrt(np.square(alpha) + np.square(beta))
    phase = np.atan2(beta, alpha)

    return CosDesc(amp, offset, phase, w0)

def processB3(data: np.ndarray) -> CosDesc:
    t = data["time"]
    value = data["value"]

    # Compute sampling frequency from first two time samples
    fsample = 1 / (t[1] - t[0])

    fft = np.fft.fft(value)

    # Search for max freq.
    maxI = 0
    maxM = 0
    for i in range(0, int(len(fft) / 2)):
        mag = np.abs(fft[i])
        if (mag > maxM):
            maxM = mag
            maxI = i

    # Only care about frequencies maxI - 1, maxI, maxI + 1
    # Create mask to zero-out all others
    mask = np.zeros(len(fft))

    for i in range(-1, 2):
        if (maxI + i >= 0 and maxI + i < len(mask)):

            # Apply mask to both bottom AND top of FFT range
            # Handles aliasing
            mask[maxI + i] = 1
            mask[len(fft) - (maxI + i)] = 1

    filt_fft = fft * mask
    filt_sig = np.fft.ifft(filt_fft)

    # Find zero crossings
    zeroes: list[float] = []
    for i in range(1, len(filt_sig)):
        a = np.real(filt_sig[i - 1])
        b = np.real(filt_sig[i])

        if ((a >= 0) != (b > 0)):

            # LERP between a_i and b_i to find straight-line-approximation of zero-crossing point
            zeroes.append(float(-b / (b - a)) + i)

    # Find average period between zero crossings
    # Strat: MEAN
    # zero_lens: list[float] = []
    # for i in range(1, len(zeroes)):
    #     zero_lens.append(zeroes[i] - zeroes[i - 1])
    # Tz = np.sum(zero_lens) / len(zero_lens)

    # Mean optimization (identical to above, just faster...):
    Tz = (zeroes[-1] - zeroes[0]) / (len(zeroes) - 1)

    Tz_freq = Tz / fsample

    # 2x zero crossings per cycle
    # => T0 = 2 * Tz
    T = 2 * Tz_freq

    # Freq from fft max index
    fsignal = 1 / T

    # Convert fsignal from Hz to rad/s
    w0 = 2 * math.pi * fsignal

    # Create transformation matrix of the shape (3 x 1024)
    E = np.array([
        np.cos(w0 * t),
        np.sin(w0 * t),
        np.ones(len(t))
    ]).transpose()
    psuedo_E = np.linalg.pinv(E)

    # Multiply matricies to get final values
    alpha, beta, offset = psuedo_E @ data["value"]

    amp = np.sqrt(np.square(alpha) + np.square(beta))
    phase = np.atan2(beta, alpha)

    return CosDesc(amp, offset, phase, w0)

# Run process B (DUT) to estimate parameters
def processB2(data: np.ndarray) -> CosDesc:
    t = data["time"]
    value = data["value"]

    # Compute sampling frequency from first two time samples
    fsample = 1 / (t[1] - t[0])

    fft = np.fft.fft(value) / len(value) * 2

    # Search for max freq.
    maxI = 0
    maxM = 0
    for i in range(0, int(len(fft) / 2)):
        mag = np.abs(fft[i])
        if (mag > maxM):
            maxM = mag
            maxI = i

    # Only care about frequencies maxI - 1, maxI, maxI + 1
    # Create mask to zero-out all others
    mask = np.zeros(len(fft))

    for i in range(-1, 2):
        if (maxI + i >= 0 and maxI + i < len(mask)):

            # Apply mask to both bottom AND top of FFT range
            # Handles aliasing
            mask[maxI + i] = 1
            mask[len(fft) - (maxI + i)] = 1

    filt_fft = fft * mask
    filt_sig = np.fft.ifft(filt_fft)

    # Find zero crossings
    zeroes: list[int] = []
    for i in range(1, len(filt_sig)):
        a = np.real(filt_sig[i - 1])
        b = np.real(filt_sig[i])

        if ((a > 0 and b < 0) or (a < 0 and b > 0)):
            zeroes.append(i)

    # Find average period between zero crossings
    # Strat: MEDIAN
    zero_lens: list[int] = []
    for i in range(1, len(zeroes)):
        zero_lens.append(zeroes[i] - zeroes[i - 1])
    zero_lens.sort()

    Tz = 0
    if (len(zero_lens) % 2 == 0):
        Tz = (zero_lens[int(len(zero_lens) / 2 - 1)] + zero_lens[int(len(zero_lens) / 2)]) / 2
    else:
        Tz = zero_lens[int(len(zero_lens) / 2)]

    Tz_freq = Tz / fsample

    # 2x zero crossings per cycle
    # => T0 = 2 * Tz
    T = 2 * Tz_freq

    # Freq from fft max index
    fsignal = 1 / T

    # Convert fsignal from Hz to rad/s
    w0 = 2 * math.pi * fsignal

    # Create transformation matrix of the shape (3 x 1024)
    E = np.array([
        np.cos(w0 * t),
        np.sin(w0 * t),
        np.ones(len(t))
    ]).transpose()
    psuedo_E = np.linalg.pinv(E)

    # Multiply matricies to get final values
    alpha, beta, offset = psuedo_E @ data["value"]

    amp = np.sqrt(np.square(alpha) + np.square(beta))
    phase = np.atan2(beta, alpha)

    return CosDesc(amp, offset, phase, w0)

# Find max freq using fft
# Use that extry exactly; Do nothing fancy
# Don't expand bins, don't attempt to interpolate, don't attempt gradient descent
# This is the bare minimum
def processB1(data: np.ndarray):

    t = data["time"]
    value = data["value"]

    # Compute sampling frequency from first two time samples
    fsample = 1 / (t[1] - t[0])

    fft = np.fft.fft(value) / len(value) * 2

    # Search for max freq.
    maxI = 0
    maxM = 0
    for i in range(0, int(len(fft) / 2)):
        mag = np.abs(fft[i])
        if (mag > maxM):
            maxM = mag
            maxI = i

    # Freq from fft max index
    freq = maxI * (fsample / len(fft)) * 2 * math.pi

    # return CosDesc(maxM, np.mag(fft[0]), fft[maxI], freq)
    return CosDesc(float(maxM), 0, -float(np.angle(fft[maxI])), float(freq))

def processB2(data: np.ndarray) -> CosDesc:
    t = data["time"]
    value = data["value"]

    # Compute sampling frequency from first two time samples
    fsample = 1 / (t[1] - t[0])

    fft = np.fft.fft(value) / len(value) * 2

    # Search for max freq.
    maxI = 0
    maxM = 0
    for i in range(0, int(len(fft) / 2)):
        mag = np.abs(fft[i])
        if (mag > maxM):
            maxM = mag
            maxI = i

    # Freq from fft max index
    fsignal = maxI * (fsample / len(fft))

    # Convert fsignal from Hz to rad/s
    w0 = 2 * math.pi * fsignal

    # Create transformation matrix of the shape (3 x 1024)
    E = np.array([
        np.cos(w0 * t),
        np.sin(w0 * t),
        np.ones(len(t))
    ]).transpose()
    psuedo_E = np.linalg.pinv(E)

    # Multiply matricies to get final values
    alpha, beta, offset = psuedo_E @ data["value"]

    amp = np.sqrt(np.square(alpha) + np.square(beta))
    phase = np.atan2(beta, alpha)

    return CosDesc(amp, offset, phase, w0)