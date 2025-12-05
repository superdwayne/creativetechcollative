// Lens Studio script: WebSocket client with simple JSON handlers.
// Attach this as a Script component to any Scene Object.
// @input string serverUrl = "ws://127.0.0.1:8765"

var socket = null;
var reconnectDelay = 1.0;  // seconds
var maxDelay = 10.0;

function toStr(x) { try { return (typeof x === "string") ? x : JSON.stringify(x); } catch (_) { return "" + x; } }

function vec3Safe(o, defx, defy, defz) {
    var x = (o && typeof o.x === 'number') ? o.x : defx;
    var y = (o && typeof o.y === 'number') ? o.y : defy;
    var z = (o && typeof o.z === 'number') ? o.z : defz;
    // vec3 is provided by Lens Studio scripting runtime
    return new vec3(x, y, z);
}

function handleCommand(data) {
    try {
        if (!data || typeof data !== 'object') { return; }
        if (data.type === 'log') {
            print('[host] ' + toStr(data.message));
            return;
        }

        if (data.type === 'addText') {
            var txt = (data.text || 'Hello');
            var so = global.scene.createSceneObject('Text');
            var tr = so.getTransform();
            tr.setWorldPosition(vec3Safe(data.pos, 0, 0, 0));
            // Try a couple of component names depending on template
            var comp = null;
            try { comp = so.createComponent('Component.Text'); } catch (e1) {}
            if (!comp) { try { comp = so.createComponent('Text'); } catch (e2) {} }
            if (comp && comp.text !== undefined) {
                comp.text = txt;
            } else {
                print('Could not create Text component on object');
            }
            return;
        }

        if (data.type === 'setTransform' && data.name) {
            var obj = global.scene.getRootObjects();
            var found = null;
            for (var i = 0; i < obj.length; i++) {
                if (obj[i].name === data.name) { found = obj[i]; break; }
            }
            if (found) {
                var t = found.getTransform();
                if (data.pos) { t.setWorldPosition(vec3Safe(data.pos, 0, 0, 0)); }
                if (data.scale) { t.setLocalScale(vec3Safe(data.scale, 1, 1, 1)); }
            } else {
                print('Object not found: ' + data.name);
            }
            return;
        }

        // Unknown command
        print('Unhandled command: ' + toStr(data));
    } catch (e) {
        print('handleCommand error: ' + toStr(e));
    }
}

function scheduleReconnect() {
    var d = Math.min(reconnectDelay, maxDelay);
    reconnectDelay = Math.min(reconnectDelay * 2.0, maxDelay);
    var t = script.createEvent('DelayedCallbackEvent');
    t.bind(connect);
    t.reset(d);
    print('LS WS reconnect in ' + d + 's');
}

function connect() {
    try {
        var url = script.serverUrl || 'ws://127.0.0.1:8765';
        print('LS WS connecting to ' + url);
        socket = new WebSocket(url);
        socket.onopen = function () {
            print('LS WS open');
            reconnectDelay = 1.0;
            try { socket.send('hello-from-lens'); } catch (e) { print('LS WS send error: ' + toStr(e)); }
        };
        socket.onmessage = function (evt) {
            var msg = evt && evt.data;
            // Try JSON first, fallback to text
            try {
                var data = JSON.parse(msg);
                handleCommand(data);
            } catch (_) {
                print('LS WS msg: ' + toStr(msg));
            }
        };
        socket.onerror = function (err) { print('LS WS error: ' + toStr(err)); };
        socket.onclose = function () { print('LS WS closed'); scheduleReconnect(); };
    } catch (e) {
        print('LS WS exception: ' + toStr(e));
        scheduleReconnect();
    }
}

var awake = script.createEvent('OnAwakeEvent');
awake.bind(function () {
    var delay = script.createEvent('DelayedCallbackEvent');
    delay.bind(connect);
    delay.reset(0.1);
});

var destroyEvent = script.createEvent('OnDestroyEvent');
destroyEvent.bind(function () { try { if (socket) { socket.close(); } } catch (e) {} });

