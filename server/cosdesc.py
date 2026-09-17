from dataclasses import dataclass

"""
Describe a cosine signal
Holds variables in the below formula:
<amp> * cos(<freq> * t - <phase>) + <offset>
"""
@dataclass
class CosDesc:
    amp: float    # Amplitude of signal
    offset: float # DC Offset of signal
    phase: float  # Phase shift of signal (rads)
    freq: float   # Frequency of signal (rad/s)