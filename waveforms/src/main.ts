import { UMailTx } from "./uMail.js";

clear(); // Clear output window
Scope.run();

const tx = new UMailTx("~/tmp/waveformsmb", "tx");

while (true) {
    tx.write("Hello, World");
    stdout("Hello, World! Written...");

    wait(1000);
}
