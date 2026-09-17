interface UMail {
    /**
     * Use some custom file writer
     * @param cb    Callback to custom file writer
     * Expected to append (not just write blindly)
     */
    write(cb: (file: file_min_t) => PromiseLike<number>): PromiseLike<void>;
    write(text: string): PromiseLike<void>;
}

/**
 * Basic mailbox
 * UMail: Unchecked (assume OS deals with concurrency issues)
 * TX: Send-only
 *
 * Files:
 * - GEN: {{prefix}}_gen.mbx
 * - DAT: {{prefix}}_dat.mbx
 */
export class UMailTx implements UMail {
    private gen: number = 0;
    private readonly rootDir: string;
    private readonly prefix: string;

    get pGen() {
        return `${this.rootDir}${this.prefix}_gen.mbx`;
    }
    get pDat() {
        return `${this.rootDir}${this.prefix}_dat.mbx`;
    }

    readonly fGen: file_min_t;
    readonly fDat: file_min_t;

    constructor(
        rootDir: string,
        prefix: string,
        options?: {
            File?: (path: string) => file_min_t;
        },
    ) {
        this.rootDir = rootDir.endsWith("/") ? rootDir : `${rootDir}/`;
        this.prefix = prefix;

        const F =
            options?.File ?? (File as unknown as (path: string) => file_min_t);
        this.fGen = F(this.pGen);
        this.fDat = F(this.pDat);
    }

    write(cb: (file: file_min_t) => PromiseLike<number>): PromiseLike<void>;
    write(text: string): PromiseLike<void>;

    async write(
        arg0: ((file: file_min_t) => PromiseLike<number>) | string,
    ): Promise<void> {
        if (typeof arg0 === "function") {
            this.fDat.write(""); // Clear file before appending
            await arg0(this.fDat);
        } else this.fDat.write(arg0);

        this.fGen.write((++this.gen).toString());
    }
}

/**
 * Double-buffered mailbox
 * UMail: Unchecked (assume OS deals with concurrency issues)
 * TX: Send-only
 * 2: 2 Buffers (0/1); Wait for buffer A to fill before swapping to B
 *
 * Files:
 * - GEN: {{prefix}}_gen.mbx
 * - DAT0: {{prefix}}_dat0.mbx (Readable iff gen % 2 == 0)
 * - DAT1: {{prefix}}_dat1.mbx (Readable iff gen % 2 == 1)
 */
export class UMail2Tx implements UMail {
    private gen: number = 0;
    private readonly rootDir: string;
    private readonly prefix: string;
    private readonly threshold: number;

    // Number of bytes written to current open file
    private bytes: number = 0;

    // Whether to clear the current file
    private clear: boolean = true;

    private nameToPath(name: string) {
        return `${this.rootDir}${this.prefix}_${name}.mbx`;
    }

    get pGen() {
        return this.nameToPath("gen");
    }
    get pDat0() {
        return this.nameToPath("dat0");
    }
    get pDat1() {
        return this.nameToPath("dat1");
    }

    readonly fGen: file_min_t;
    readonly fDat0: file_min_t;
    readonly fDat1: file_min_t;

    constructor(
        rootDir: string,
        prefix: string,
        options?: {
            /** Minimum number of bytes to write before switching to other buffer */
            threshold?: number;

            File?: (path: string) => file_min_t;
        },
    ) {
        this.rootDir = rootDir.endsWith("/") ? rootDir : `${rootDir}/`;
        this.prefix = prefix;
        this.threshold = options?.threshold ?? 1024;

        const F =
            options?.File ?? (File as unknown as (path: string) => file_min_t);
        this.fGen = F(this.pGen);
        this.fDat0 = F(this.pDat0);
        this.fDat1 = F(this.pDat1);
    }

    write(cb: (file: file_min_t) => PromiseLike<number>): PromiseLike<void>;
    write(text: string): PromiseLike<void>;

    async write(
        arg0: ((file: file_min_t) => PromiseLike<number>) | string,
    ): Promise<void> {
        // Get current writable file
        // This is the file that is NOT pointed at by the generation counter
        const f = this.gen % 2 === 0 ? this.fDat1 : this.fDat0;

        if (this.clear) {
            f.write(""); // Clear file
            this.clear = false;
        }

        if (typeof arg0 === "function") {
            this.bytes += await arg0(f);
        } else {
            f.append(arg0);
            this.bytes += arg0.length;
        }

        // At or above threshold
        // Update generation counter to point at the
        // file we just wrote to
        if (this.bytes >= this.threshold) {
            this.fGen.write((++this.gen).toString());
            this.bytes = 0;
            this.clear = true;
        }
    }
}
