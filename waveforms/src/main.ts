import { UMail2Tx, UMailTx } from "./uMail.js";

const rootDir = "/tmp/mailbox";
const prefix = "t";
const minPeriod = 100; // Min time between subsequent reads (ms)

// Main function (entry point)
function main() {
    // Ensure scope is available
    if (typeof Scope === "undefined") {
        print("Scope unavailable. Start Scope, then rerun");
        return;
    }

    const byteSizes = ["B", "KB", "MB", "GB"];

    // Create mailbox
    const tx = new UMail2Tx(rootDir, prefix, {
        threshold: 10000,
    });

    print(`Writing to "${rootDir}"...`);

    try {
        Scope.run();

        // Main scope loop
        let start = new Date().getTime();
        while (wait()) {
            const now = new Date().getTime();
            const delta = now - start - minPeriod;
            if (delta < 0) {
                wait(-delta / 1000); // Need to wait some extra time...
            }

            start = new Date().getTime();

            const data = Scope.Channel1.data; // Raw data
            const dt = 1000 / Scope.Time.Rate.value; // Time between samples (in ms)
            const t0 =
                -(data.length * dt) / 2 + 1000 * Scope.Time.Position.value; // Time of sample 0 (in ms)

            // Assemble CSV from data + synthesized time
            // Stored in format [t, data@t]
            const csv = []; // Store individual lines
            for (const i in data) {
                const t = (t0 + +i * dt) / 1000;
                csv.push(`${t},${data[i]}`);
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

            print(`Wrote ${data.length} points (${aSize} ${aSuffix})`);
        }
    } catch (err) {
        throw err;
    } finally {
        // Ensure scope is stopped
        Scope.stop();
    }
}

main();
