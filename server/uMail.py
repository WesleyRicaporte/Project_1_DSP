from watchdog.events import FileSystemEventHandler, FileSystemEvent
from watchdog.observers import Observer
from watchdog.observers.api import BaseObserver
from pathlib import Path
from collections.abc import Callable

"""
 * Basic mailbox
 * UMail: Unchecked (assume OS deals with concurrency issues)
 * RX: Receive-only
 *
 * Files:
 * - GEN: {{prefix}}_gen.mbx
 * - DAT: {{prefix}}_dat.mbx
"""
class UMailRx(FileSystemEventHandler):

    observer: BaseObserver

    pGen: Path # Path to generation counter
    pDat: Path # Path to data
    onRx: Callable[[str], None] # Called whenever update occurs, with contents of file

    lastGen: int = -1

    def __init__(self, rootDir: str, prefix: str, onRx: Callable[[str], None]):

        # Ensure rootDir ends with "/"
        rootDir = rootDir if rootDir.endswith("/") else f"{rootDir}/"

        # Store normalized paths
        self.pGen = Path(f"{rootDir}{prefix}_gen.mbx")
        self.pDat = Path(f"{rootDir}{prefix}_dat.mbx")
        self.onRx = onRx

        # Start observer on self
        self.observer = Observer()
        self.observer.schedule(self, path=rootDir, recursive=False)
        self.observer.start()

    def destroy(self) -> None:
        self.observer.stop()
        self.observer.join()

    def on_modified(self, event: FileSystemEvent) -> None:

        # Ignore modifications to the underlying dir
        if (event.is_directory):
            return

        srcPath = Path(event.src_path) # Normalize source path

        # Not an update to generation counter; Ignore...
        if (srcPath != self.pGen):
            return

        # Ensure generation counter actually changed
        newGen = 0
        try:
            newGen = int(self.pGen.read_text())
        except ValueError:
            return # Invalid contents; Ignore...

        # No change; ignore
        if (newGen  == self.lastGen):
            return

        # Change registered and accepted; Read data and run callback
        self.lastGen = newGen

        contents = ""
        try:
            contents = self.pDat.read_text()
        except FileNotFoundError:
            print(f"File {self.pDat.resolve()} not found...")
            return

        # Read text contents of data file and pass to onRx callback
        self.onRx(contents)

"""
 * Double-buffered mailbox
 * UMail: Unchecked (assume OS deals with concurrency issues)
 * TX: Send-only
 * 2: 2 Buffers (0/1); Wait for buffer A to fill before swapping to B
 *
 * Files:
 * - GEN: {{prefix}}_gen.mbx
 * - DAT0: {{prefix}}_dat0.mbx (Readable iff gen % 2 == 0)
 * - DAT1: {{prefix}}_dat1.mbx (Readable iff gen % 2 == 1)
"""
class UMail2Rx(FileSystemEventHandler):

    observer: BaseObserver

    pGen: Path # Path to generation counter
    pDat0: Path # Path to data
    pDat1: Path # Path to data
    onRx: Callable[[str], None] # Called whenever update occurs, with contents of file

    lastGen: int = -1

    def __init__(self, rootDir: str, prefix: str, onRx: Callable[[str], None]):

        # Ensure rootDir ends with "/"
        rootDir = rootDir if rootDir.endswith("/") else f"{rootDir}/"

        # Store normalized paths
        self.pGen = Path(f"{rootDir}{prefix}_gen.mbx")
        self.pDat0 = Path(f"{rootDir}{prefix}_dat0.mbx")
        self.pDat1 = Path(f"{rootDir}{prefix}_dat1.mbx")
        self.onRx = onRx

        # Start observer on self
        self.observer = Observer()
        self.observer.schedule(self, path=rootDir, recursive=False)
        self.observer.start()

    def destroy(self) -> None:
        self.observer.stop()
        self.observer.join()

    def on_modified(self, event: FileSystemEvent) -> None:

        # Ignore modifications to the underlying dir
        if (event.is_directory):
            return

        srcPath = Path(event.src_path) # Normalize source path

        # Not an update to generation counter; Ignore...
        if (srcPath != self.pGen):
            return

        # Ensure generation counter actually changed
        newGen = 0
        try:
            newGen = int(self.pGen.read_text())
        except ValueError:
            return # Invalid contents; Ignore...

        # No change; ignore
        if (newGen  == self.lastGen):
            return

        # Change registered and accepted; Read data and run callback
        self.lastGen = newGen

        # Determine which data file to pull from based on generation counter parity
        pDat = self.pDat0 if self.lastGen % 2 == 0 else self.pDat1

        contents = ""
        try:
            contents = pDat.read_text()
        except FileNotFoundError:
            print(f"File {pDat.resolve()} not found...")
            return

        # Read text contents of data file and pass to onRx callback
        self.onRx(contents)
