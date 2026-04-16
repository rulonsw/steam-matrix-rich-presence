import { MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin } from "matrix-bot-sdk";
import express from "express";
import * as dotenv from "dotenv";

dotenv.config();

const homeserverUrl = process.env.MATRIX_HOMESERVER_URL || "https://matrix.org";
const accessToken = process.env.MATRIX_ACCESS_TOKEN;
const port = process.env.PORT || 3000;
const apiSecret = process.env.API_SECRET;
const targetRoomId = process.env.MATRIX_ROOM_ID;

if (!accessToken || !apiSecret || !targetRoomId) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const storage = new SimpleFsStorageProvider("bot.json");
const client = new MatrixClient(homeserverUrl, accessToken, storage);
AutojoinRoomsMixin.setupOnClient(client);

const app = express();
app.use(express.json());

app.post("/presence", async (req, res) => {
    const { secret, user, game, status } = req.body;

    if (secret !== apiSecret) {
        return res.status(403).send("Forbidden");
    }

    console.log(`Received update: ${user} is ${status} ${game}`);

    let message = "";
    if (status === "playing") {
        message = `🎮 ${user} is now playing **${game}**`;
    } else if (status === "stopped") {
        message = `🛑 ${user} stopped playing **${game}**`;
    }

    if (message) {
        try {
            await client.sendMessage(targetRoomId, {
                msgtype: "m.notice",
                body: message,
                format: "org.matrix.custom.html",
                formatted_body: message.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
            });
            res.send("OK");
        } catch (e) {
            console.error("Failed to send Matrix message:", e);
            res.status(500).send("Error");
        }
    } else {
        res.send("No update");
    }
});

client.start().then(() => {
    console.log("Matrix bot started!");
    app.listen(port, () => {
        console.log(`Server API listening on port ${port}`);
    });
});
