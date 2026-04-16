import axios from "axios";
import * as dotenv from "dotenv";
import psList from "ps-list";
import path from "path";

dotenv.config();

const apiEndpoint = process.env.API_ENDPOINT || "http://localhost:3000/presence";
const apiSecret = process.env.API_SECRET;
const username = process.env.STEAM_USERNAME || "User";
const interval = parseInt(process.env.POLL_INTERVAL || "30000");

if (!apiSecret) {
    console.error("Missing API_SECRET in .env");
    process.exit(1);
}

let lastGame: string | null = null;

async function checkSteamGames() {
    try {
        const processes = await psList();
        // Steam games on macOS are often in '.../SteamApps/common/...'
        const steamGameProcess = processes.find(p => 
            p.cmd && (p.cmd.includes("SteamApps/common") || p.cmd.includes("steamapps/common"))
        );

        let currentGame: string | null = null;
        if (steamGameProcess && steamGameProcess.cmd) {
            // Heuristic: Extract game folder name after 'common/'
            const match = steamGameProcess.cmd.match(/common\/([^/]+)/);
            if (match) {
                currentGame = match[1];
            }
        }

        if (currentGame !== lastGame) {
            if (currentGame) {
                console.log(`Started playing: ${currentGame}`);
                await sendUpdate(currentGame, "playing");
            } else if (lastGame) {
                console.log(`Stopped playing: ${lastGame}`);
                await sendUpdate(lastGame, "stopped");
            }
            lastGame = currentGame;
        }
    } catch (e) {
        console.error("Error checking processes:", e);
    }
}

async function sendUpdate(game: string, status: "playing" | "stopped") {
    try {
        await axios.post(apiEndpoint, {
            secret: apiSecret,
            user: username,
            game: game,
            status: status
        });
    } catch (e: any) {
        console.error("Failed to send update to server:", e.message);
    }
}

console.log("Steam Listener started...");
setInterval(checkSteamGames, interval);
checkSteamGames();
