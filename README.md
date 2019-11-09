# Purpose

This [Discord](https://discordapp.com/) bot reads from a [Google Sheet](https://www.google.com/sheets/about/) and updates the users roles based on the role in the sheet.

---

# User Manual

* To add the bot to your server, Navigate to `https://discordapp.com/oauth2/authorize?&client_id=YOUR_CLIENT_ID&scope=bot&permissions=8` (replace `YOUR_CLIENT_ID` with the client ID of the Discord application). You must have the appropriate permissions on that server.
* By default, there is no administrator password so everyone can take control of the bot. Change the administrator password as soon as possible. You can DM the bot so that the password is not visible to others on the server.
* The bot reacts to commands issued to it. You can issue it commands through DM, or by writing the command in any channel the bot is in.
* For a full list of available commands, use the `!help` command.

---

# Contributing

## Getting started

* Download and install [NodeJS](https://nodejs.org/en/download/)
* Run `npm install`
* Follow the "initialization" steps (listed below)
* Run `npm start` to start the bot.
* Run `npm run package` to make an `.exe` file out of the bot.

### Initialization
1. Create a `secrets.json` file.
2. [Create a Discord application](https://discordapp.com/developers/applications/)
3. Get a token and a client ID
4. Place the token in `secrets.json` as `"token"`
5. Navigate to `https://discordapp.com/oauth2/authorize?&client_id=YOUR_CLIENT_ID&scope=bot&permissions=8` (replace `YOUR_CLIENT_ID` with the client ID of the Discord application)
6. [Create a GCloud application](https://console.developers.google.com/project)
7. Create a "Service Account"
8. Generate a key for the service account
9. Place the keys email in `secrets.json` as `gcloud_client_email`
10. Place the keys private key in `secrets.json` as `gcloud_private_key`
