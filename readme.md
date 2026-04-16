# Steam Matrix Rich Presence Bridge

Relay Steam rich presence data to Matrix.

## Architecture
- `server/`: Matrix bot and status API.
- `client/`: Local process monitor for Steam on macOS.

## Setup

### Server
1. `cd server`
2. `npm install`
3. `cp .env.example .env`
4. Update `.env` with your Matrix access token and room ID.
5. `npm run dev`

### Client
1. `cd client`
2. `npm install`
3. `cp .env.example .env`
4. Update `.env` with your API secret and preferred name.
5. `npm run dev`

## How it works
The client monitors your system for running games launched via Steam (specifically looking for processes within `steamapps/common`). When a change is detected, it sends a POST request to the server, which then posts a notice to the configured Matrix room.
