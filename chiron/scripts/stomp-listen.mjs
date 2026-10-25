// Minimal STOMP client without dependencies (Node 22+, built-in WebSocket) for manual testing of notifications:
// connects to the Chiron WebSocket endpoint with a bearer token, subscribes to the user's notification queue and
// prints every frame it receives, one line each, until Ctrl+C or until the server closes the connection.
//
// Usage (the application must be running):
//   node chiron/scripts/stomp-listen.mjs --email client1@seed.chiron.local --password password123
//   node chiron/scripts/stomp-listen.mjs --token <jwt> [--destination /user/queue/notifications]
//   node chiron/scripts/stomp-listen.mjs --url http://localhost:8080 ...
// Without --email / --token the CONNECT frame carries no token, which the server must reject with an ERROR frame.

import { parseArgs } from "node:util";

const { values: args } = parseArgs({
    options: {
        url: { type: "string", default: "http://localhost:8080" },
        email: { type: "string" },
        password: { type: "string" },
        token: { type: "string" },
        destination: { type: "string", default: "/user/queue/notifications" },
    },
});

const log = (...parts) => console.log(new Date().toISOString(), ...parts);

async function login(email, password) {
    const response = await fetch(`${args.url}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const json = await response.json();
    if (!json.success) throw new Error(`Login failed: ${JSON.stringify(json.error)}`);
    return json.result.accessToken;
}

// A STOMP frame: command, headers, blank line, body, NUL.
function frame(command, headers = {}, body = "") {
    const headerLines = Object.entries(headers).map(([name, value]) => `${name}:${value}\n`).join("");
    return `${command}\n${headerLines}\n${body}\0`;
}

function parseFrame(raw) {
    const separator = raw.indexOf("\n\n");
    const [command, ...headerLines] = raw.slice(0, separator).split("\n");
    const headers = Object.fromEntries(
        headerLines.map((line) => [line.slice(0, line.indexOf(":")), line.slice(line.indexOf(":") + 1)]),
    );
    return { command, headers, body: raw.slice(separator + 2) };
}

const token = args.token ?? (args.email ? await login(args.email, args.password) : undefined);
const socket = new WebSocket(`${args.url.replace(/^http/, "ws")}/ws`);

socket.addEventListener("open", () => {
    const headers = { "accept-version": "1.2", host: new URL(args.url).hostname, "heart-beat": "0,0" };
    if (token) headers.Authorization = `Bearer ${token}`;
    socket.send(frame("CONNECT", headers));
});

// Frames may be split across or packed into WebSocket messages, so they are cut at NUL; bare newlines are heartbeats.
let buffer = "";
socket.addEventListener("message", (event) => {
    buffer += event.data;
    let end;
    while ((end = buffer.indexOf("\0")) >= 0) {
        const raw = buffer.slice(0, end).replace(/^\n+/, "");
        buffer = buffer.slice(end + 1);
        if (raw) handle(parseFrame(raw));
    }
});

function handle({ command, headers, body }) {
    switch (command) {
        case "CONNECTED":
            log("CONNECTED", `user-name=${headers["user-name"] ?? ""}`);
            socket.send(frame("SUBSCRIBE", { id: "sub-0", destination: args.destination }));
            log("SUBSCRIBE", args.destination);
            break;
        case "MESSAGE":
            log("MESSAGE", body);
            break;
        default:
            log(command, headers.message ?? "", body);
    }
}

// No process.exit() here: on Windows it aborts Node when called from the close event; the process ends by itself.
socket.addEventListener("close", (event) => log("CLOSED", event.code));
socket.addEventListener("error", (event) => log("SOCKET ERROR", event.message ?? ""));

process.on("SIGINT", () => {
    socket.send(frame("DISCONNECT"));
    socket.close();
});
