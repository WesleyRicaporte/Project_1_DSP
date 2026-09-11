declare global {
    const wait: (ms?: number) => boolean;
    const print: (...args: string[]) => void;
    const clear: () => void;

    const Device: {
        isConnected(): boolean;
        readonly name: string;
        readonly SN: number;
        triggerPC(): void;
    };

    const Scope: {
        single: () => void;
        run: () => void;
        stop: () => void;
        wait: (delay?: number) => void;

        export: (file: string) => void;

        Channel1: {
            data: number[];
        };

        Time: {
            Rate: {
                // Sampling frequency (Hz)
                value: number;
            };

            Position: {
                value: number;
            };
        };
    };

    const Tcp: () => {
        listen: (address: string, port: number) => void;
        disconnect: () => void;
        close: () => void;
        // connect: (address: string, port: number) => void;

        isConnected: () => boolean;
        waitForNewConnection: (timeout: number) => void;

        write: (bytes: number[]) => number;
        writeText: (text: string) => number;
        writeInt: (int: string) => number;
        writeFloat: (float: string) => number;
        writeDouble: (double: string) => number;

        readAvailable: () => number;
        waitAvailable: (bytes: number, timeout: number) => number;

        read(size: number): number[];
        readText(length: number): string;
        readInt32(length: number): number[];
        readFloat(length: number): number[];
        readDouble(length: number): number[];
    };

    const File: (path: string) => file_t;

    type file_t = {
        exists: () => void;
        getName: () => string;
        getPath: () => string;
        getSize: () => number;
        isReadOnly: () => boolean;
        isHidden: () => boolean;
        getLastModified: () => Date;
        getCreation: () => Date;

        rename: (name: string) => void;
        copy: (path: string) => void;
        deleteFile: () => void;

        read: (size?: number) => string;
        readArray: () => string[];

        write: (text: string) => void;
        writeLine: (text: string) => void;
        append: (text: string) => void;
        appendLine: (text: string) => void;
    };
}

export {};
