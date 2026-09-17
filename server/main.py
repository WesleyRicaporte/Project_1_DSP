import socket
import time
from pathlib import Path
from watchdog.events import FileSystemEventHandler, FileSystemEvent
from watchdog.observers import Observer

rootDir = "/tmp/mailbox"

def main():

    # Create mailbox if it doesn't yet exist...
    Path(rootDir).mkdir(parents=True, exist_ok=True)

    # Watch mailbox
    handler = Handler()
    observer = Observer()
    observer.schedule(handler, path=rootDir, recursive=False)
    observer.start()

    # Keep running until stopped
    try:
        while (True):
            time.sleep(1)
    finally:
        observer.stop()
        observer.join()


class Handler(FileSystemEventHandler):
    def on_modified(self, event: FileSystemEvent) -> None:
        print(event)


if (__name__ == "__main__"):
    main()