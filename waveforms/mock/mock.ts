// Mock `main.ts` operation _WITHOUT_ a real device

import { UMail2Tx } from "../src/uMail.js";
import fs from "fs";
import path from "path";

const rootDir = "/tmp/mailbox";
const minPeriod = 500; // Min time between subsequent reads (ms)

const mockFreq = 10; // Mock frequency
const samplesPerReading = 1024;
const sampleRate = 100; // Samples per second
const noise = 0.01;

function main() {
    const byteSizes = ["B", "KB", "MB", "GB"];

    const tx = new UMail2Tx(rootDir, "tx", {
        threshold: 10000,
        File: (p: string) => {
            // Ensure dir exists
            const dirName = path.dirname(p);
            fs.mkdirSync(dirName, { recursive: true });

            return {
                write: (text: string) => {
                    fs.writeFileSync(p, text, { flush: true });
                    return text.length;
                },
                append: (text: string) => {
                    fs.appendFileSync(p, text, { flush: true });
                    return text.length;
                },
                getPath: () => p,
            };
        },
    });
    console.log(`Writing to "${rootDir}"...`);

    setInterval(() => {
        const csv: string[] = [];

        // Generate points
        for (let i = 0; i < samplesPerReading; i++) {
            const t = i / sampleRate;
            const v = Math.cos(t * mockFreq) + Math.random() * noise;

            csv.push(`${t},${v}`);
        }

        const contents = csv.join("\n") + "\n";
        tx.write(contents);

        const size = contents.length;

        // Compress size to human-readable format
        const suffixI = Math.min(
            Math.floor(Math.log10(size) / 3),
            byteSizes.length - 1,
        );
        const aSize = (size / 1000 ** suffixI).toFixed(2);
        const aSuffix = byteSizes[suffixI];

        console.log(`Wrote ${csv.length} points (${aSize} ${aSuffix})`);
    }, minPeriod);
}

main();
