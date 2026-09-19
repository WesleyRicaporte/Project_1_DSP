# Project_1_DSP

Non-MATLAB-based approach to estimating `amplitude`, `frequency`, `phase` and `offset` parameters of a sinusoidal signal

| CATEGORY  | ATTRIBUTION                          |
| --------- | ------------------------------------ |
| Authors   | Wesley Ricaporte , Nicholas T.       |
| Class     | ECEN4632 - Digital Signal Processing |
| Professor | Dr. Talles Santos                    |

## Requirements to Run

Machine must be POSIX-compatible

- MacOS
- Most major Linux distributions
- Windows Subsystem for Linux

Machine must have both `node.js` and `python3` installed

## Code Setup

This project was completed entirely without the use of MATLAB, to prove the viability and speed of other languages for heavy data processing. This appendix covers the implementation details of this approach.

## 1. Technology Stack

Data acquisition was performed using Waveform’s built-in scripting language. All data processing in this project was performed in Python using the NumPy library. Data rendering was performed in a separate process running in a browser, rendering a webpage powered by Vite, using the Plotly.js plotting library.
Communication between all components was facilitated using either the filesystem or WebSockets.

## 2. Components

This project’s code is cleanly divisible into three major components. These subsections go into further detail as to how each component works.

### 2.1 Waveforms Script

The code for this section is available in the GitHub repository under the `waveforms/src/`folder.
Waveforms is the software used to communicate with the physical AD2 hardware. It accepts custom scripts running code adhering to the EcmaScript 5 (ES5) standard.
Code for waveforms was written in Typescript, a language that can be configured to compile into ES5. This was done for ease-of-programming and readability. Typescript, as the name suggests, adds types to EcmaScript. This helps the language to catch errors that the programmer may otherwise have missed.
The Waveforms script performs two tasks:

1. Gathering data from the AD2
2. Shipping data from Waveforms to the next component in the data-processing pipeline

#### 2.1.1 Data Acquisition Loop

This loop lives under the `waveforms/src/main.ts` file in the GitHub repository, within the main.ts file. This code performs the following sequence:

1. Ensure the Scope tab is open in Waveforms. Without this, the script is unable to access AD2 channel data
2. Initialize a send-only double-buffer Mailbox (see section A.2.1.2 for more details)
3. Wait for a new sample to come in
    - Sample is ignored if generated too quickly. This is done to limit the number of Mailbox writes to a reasonable frequency
4. Read scope data. This includes the raw data (points in an ES5 array), sampling rate (for later real-world frequency conversion), and initial sample time (to properly respect phase shift throughout the process)
5. Generate an in-memory CSV file, where columns are in the format [ time (ms), data (V) ]
6. Write the contents of the in-memory CSV file into the Mailbox
7. Main processing loop done; REPEAT FROM STEP 3

#### 2.1.2 Mailboxes

A Mailbox is a protocol which uses the filesystem to transfer discrete units of data between processes. To avoid wearing out real disk drives, it is recommended that all Mailboxes are pointed to a tmpfs file system partition.

The code for the Mailbox used in this project can be viewed on the GitHub repository under the `waveforms/src/uMail.ts` directory. The UMail2Tx class is the only Mailbox in use. The previous is a simpler version of the same overall concept.

The name UMail2Tx fully describes the Mailbox’s intended operation.

- **U**: Unchecked. Data is sent without receipt ever being verified
- **Mail**: Mailbox
- **2**: The number of buffers to write to
- **Tx**: The Mailbox only supports transmission

This Mailbox works off of a double-buffering system, making use of 3 files:

- t_gen.mbx: A generation counter stored in plain ASCII. Used both to point at the “readable” mailbox file and to indicate when a new message in the mailbox is ready
- t_dat0.mbx: One of the buffers in the Mailbox. Readable by the RX side iff the generation counter is even
- dat1.mbx: One of the buffers in the Mailbox. Readable by the RX side iff the generation counter is odd

The UMail2Tx protocol requires one piece of synchronized data between the sender and receiver: the generation counter. This is a number that is incremented whenever a new message is sent. The act of this value changing indicates to the receiver that a new message is available from the sender. The value after changing indicates which buffer to read from.

The procedure to write data to a UMail2Tx is as follows: 8. Identify the currently non-readable file (based on the current generation counter value) 9. Write the data to the non-readable file, overwriting any previous contents 10. Increment the generation counter by 1. This points the reader to the file we just wrote

In this way, Mailboxes are able to effectively transmit infinitely many discrete packets of information while taking up only 3 files on the disk at any given time.

### 2.2 Server

The code for this section is available in the GitHub repository under the `server/`folder.
The server itself runs on the same machine running the Waveforms process. It is broken into two major parts, one driving the other:

- Support Loop
- Processing

The details of each part are discussed below.

#### 2.2.1 Support Loop

This loop handles reading the UMail2Tx Mailbox from Waveforms, converting the raw string data into a NumPy ndarray, then handing the ndarray over to the processing code (See Section A.2.2.2). The processing section returns an CosDesc—a complete description of a sinusoidal wave that the processing code believed best fit the input ndarray samples. This description is then used to synthesize a cosine wave.
The synthesized wave is then compared against the original, through the Mean-Square-Error metric. This error metric, the original and synthesized signals, and the description of the cosine wave, is then sent via WebSockets to the client.

#### 2.2.2 Processing

This portion of the code can be found under `server/process.py`, and exports two main functions: `processA` and `processB`. These functions each independently process the passed in ndarray representing the original signal, and return a CosDesc, a complete description of a sinusoidal that the processing code determined best fits the input data. This description is made of the following scalars:

- Amplitude
- Offset
- Phase
- Frequency

The code for the CosDesc data class can be found under `server/cosdesc.py`.

### 2.3 Client

The code for this section is available in the GitHub repository under the `client/`folder.
This component is the simplest of the three. Its job is to simply render the data provided by the WebSocket connection to the server and render the data to the screen.
Graph rendering is handled by Plotly.js, a plotting library chosen specifically due to its ability to plot thousands of points without majorly slowing down the browser.
Client code is rendered using the Vite framework. This provides many advantages, the major being provisions for writing browser-based apps in TypeScript, rather than needing to use raw JavaScript.

## 3 Code Execution

This project requires the following programs to be installed on your computer:

- node.js (Install at https://nodejs.org/en/download)
- python3 (Install at https://www.python.org/downloads/)

If they are not installed this project will not function.

Additionally this project expects to run in a POSIX environment (Linux and MacOS users can run the project natively. Windows users will need to install Windows Subsystem for Linux).

After downloading the project, first install all node packages. Run command `npm i` in the project’s root directory. Once this successfully completes, the project is ready to run.

Follow the steps below to run the project: 11. Run the command `npm run build` from the project’s root directory. This will produce the build artifact `waveforms/build/build.js`, representing the ES5 Waveforms script. When built properly, this file is a single line of compressed EcmaScript. 12. Open Waveforms and copy the contents of the built `waveforms/build/build.js` into the Script tab. Also open the Scope tab 13. Connect the AD2 to your computer and Waveforms, then start the Waveforms script 14. In the project root directory, run the command `npm run server`. This will start the python server. If it is your first time running this command, it will take some time to set up the python virtual environment and install all packages 15. In the project root directory, run the command `npm run client`. In the terminal, this will show a URL (`localhost:5173` or `127.0.0.1:5173`). Navigate to this URL in your preferred web browser
