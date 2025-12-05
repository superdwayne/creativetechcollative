// Lens Studio script: Connect to local WebSocket server
// Usage: add this as a Script component on any Scene Object.
// It will connect on start to ws://127.0.0.1:8765 and log messages.

// @input string serverUrl = "ws://127.0.0.1:8765"

var socket = null;

function toStr(x) {
    try {
        return (typeof x === "string") ? x : JSON.stringify(x);
    } catch (_) {
        return "" + x;
    }
}

function connect() {
    try {
        var url = script.serverUrl || "ws://127.0.0.1:8765";
        print("LS WS connecting to " + url);
        socket = new WebSocket(url);
        socket.onopen = function () {
            print("LS WS open");
            try { socket.send("hello-from-lens"); } catch (e) { print("LS WS send error: " + toStr(e)); }
        };
        socket.onmessage = function (e) {
            var msg = e && e.data;
            print("LS WS msg: " + toStr(msg));
            // Optional: parse JSON messages and act on them here.
            // try {
            //   var data = JSON.parse(msg);
            //   // handle commands like {type:"addText", text:"Hello"}
            // } catch (err) {}
        };
        socket.onerror = function (e) { print("LS WS error: " + toStr(e)); };
        socket.onclose = function () { print("LS WS closed"); };
    } catch (e) {
        print("LS WS exception: " + toStr(e));
    }
}

// Bind on Awake with a tiny delay to avoid "Component is not yet awake" issues
var awake = script.createEvent("OnAwakeEvent");
awake.bind(function () {
    var delay = script.createEvent("DelayedCallbackEvent");
    delay.bind(connect);
    delay.reset(0.1);
});

var destroyEvent = script.createEvent("OnDestroyEvent");
destroyEvent.bind(function () {
    try { if (socket) { socket.close(); } } catch (e) {}
});
