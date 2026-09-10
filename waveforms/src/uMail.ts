export class UMailTx {
    private gen: number = 0;
    private readonly rootDir: string;
    private readonly prefix: string;

    get pGen() {
        return `${this.prefix}_gen.mbx`;
    }
    get pDat() {
        return `${this.prefix}_dat.mbx`;
    }

    readonly fGen: file_t;
    readonly fDat: file_t;

    constructor(rootDir: string, prefix: string) {
        this.rootDir = rootDir.endsWith("/") ? rootDir : `${rootDir}/`;
        this.prefix = prefix;

        this.fGen = File(this.pGen);
        this.fDat = File(this.pDat);
    }

    write(cb: (file: file_t) => void): void;
    write(text: string): void;

    write(arg0: ((file: file_t) => void) | string) {
        if (typeof arg0 === "function") arg0(this.fDat);
        else this.fDat.write(arg0);

        this.fGen.write((++this.gen).toString());
    }
}
