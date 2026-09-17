declare global {
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

    type file_min_t = Pick<file_t, "write" | "append" | "getPath">;
}

export {};
