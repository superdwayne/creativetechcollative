Lens Studio WebSocket Companion

This folder contains a minimal setup to connect Lens Studio 5.13.x to a local WebSocket on your Mac and send/receive messages for automation.

Files
- ws_companion_lens.js — Lens Studio Script component that connects to a local WS (default ws://127.0.0.1:8765). Attach to any Scene Object.
- ws_companion_lens_handlers.js — Same as above, with JSON command handling helpers (addText, log, setTransform best‑effort).
- ws_echo.py — Tiny echo WebSocket to verify connectivity.
- ws_bridge.py — Interactive bridge: run a local WS server and type JSON commands to send to Lens Studio.

Quick start
1) Start a server
   - cd ~/Documents/Playground/lens-mcp
   - ./.venv/bin/python lens-ws/ws_echo.py
     (or) ./.venv/bin/python lens-ws/ws_bridge.py

2) In Lens Studio
   - Add an Empty Object → add a Script component → paste the contents of lens-ws/ws_companion_lens.js (or use the handlers version).
   - In the script inspector, set Server Url to match the server (e.g., ws://127.0.0.1:8765).
   - Click “Preview Lens” to run. Open the Logger to see connection and messages.

3) Send a message (if using ws_bridge.py)
   - Type: json {"type":"log","message":"hello from host"}
   - You should see it logged in Lens Studio.

Notes
- If the port is in use, either stop the existing process or change both the server and the Script component Server Url to a free port (e.g., 8787).
- The handler script uses best‑effort API calls and guards with try/catch to avoid breaking preview if a component isn’t available in your template.

