#!/usr/bin/env python3
"""
Interactive WebSocket bridge for Lens Studio.

- Starts a WS server on 127.0.0.1:8765 by default
- Prints any message received from Lens Studio
- Lets you type commands to send to Lens:
    - text <raw>        : send raw text
    - json <json>       : send JSON (e.g., json {"type":"log","message":"hi"})
    - demo              : send a small demonstration sequence
    - help              : show commands
    - quit/exit         : stop

Usage:
  cd ~/Documents/Playground/lens-mcp
  ./.venv/bin/python lens-ws/ws_bridge.py [--port 8765]
"""

import argparse
import asyncio
import json
import sys
from typing import Set

import websockets


async def ws_handler(websocket):
    print("[bridge] client connected")
    try:
        async for msg in websocket:
            print("[lens]", msg)
    except Exception as e:
        print("[bridge] client error:", e)
    finally:
        print("[bridge] client disconnected")


async def stdin_sender(conns: Set[websockets.WebSocketServerProtocol]):
    loop = asyncio.get_event_loop()
    print("Commands: text <msg> | json <json> | demo | help | quit")
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            await asyncio.sleep(0.05)
            continue
        line = line.strip()
        if not line:
            continue
        if line in {"quit", "exit"}:
            for c in list(conns):
                try:
                    await c.close()
                except Exception:
                    pass
            break
        if line == "help":
            print("Commands: text <msg> | json <json> | demo | help | quit")
            continue
        if line == "demo":
            payloads = [
                {"type": "log", "message": "hello from host"},
                {"type": "addText", "text": "Clown!", "pos": {"x": 0, "y": 0.1, "z": 0}},
            ]
            for p in payloads:
                data = json.dumps(p)
                for c in list(conns):
                    try:
                        await c.send(data)
                    except Exception as e:
                        print("[bridge] send error:", e)
            continue
        if line.startswith("json "):
            body = line[5:].strip()
            try:
                json.loads(body)
            except Exception as e:
                print("[bridge] invalid JSON:", e)
                continue
            for c in list(conns):
                try:
                    await c.send(body)
                except Exception as e:
                    print("[bridge] send error:", e)
            continue
        if line.startswith("text "):
            body = line[5:]
            for c in list(conns):
                try:
                    await c.send(body)
                except Exception as e:
                    print("[bridge] send error:", e)
            continue
        print("[bridge] unknown command. Type 'help'.")


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    conns: Set[websockets.WebSocketServerProtocol] = set()

    async def accept(ws):
        conns.add(ws)
        try:
            await ws_handler(ws)
        finally:
            conns.discard(ws)

    async with websockets.serve(accept, "127.0.0.1", args.port):
        print(f"[bridge] listening on ws://127.0.0.1:{args.port}")
        await stdin_sender(conns)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass

