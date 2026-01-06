const express = require('express');
const router = express.Router();

// Farcaster Mini App Manifest
router.get('/farcaster.json', (req, res) => {
    const appUrl = process.env.APP_URL || `https://${req.get('host')}`;

    const manifest = {
        accountAssociation: {
            header: "eyJmaWQiOjE0ODEzODcsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhFMzM1YzcxRTE3NkVhN0I0RjQxRjE3MUIzMWZEMDVmNDE5MDg3NjUyIn0",
            payload: "eyJkb21haW4iOiJtaW5lc3dlZXBlci1hbHBoYS10aHJlZS52ZXJjZWwuYXBwIn0",
            signature: "7SDFKKpAlgYQMc3AuaVgQI0XcOHN0LCKKy3jRRp9NF4vJ0kh4rDE6mKk14PUAPKWHagx9cK+wcx/5eeDD8Ie9Rs="
        },
        frame: {
            name: "Minesweeper",
            version: "1",
            iconUrl: `${appUrl}/icon.png`,
            homeUrl: appUrl.endsWith('/') ? appUrl : `${appUrl}/`,
            subtitle: "Minesweeper game",
            primaryCategory: "games",
            description: "Classic Minesweeper as a Farcaster Mini App: quick taps, smart flags, timed runs, and rankings across three difficulties.",
            splashBackgroundColor: "#000000",
            splashImageUrl: `${appUrl}/splash.png`,
            tags: ["minesweeper", "game", "démineur"]
        }
    };

    res.json(manifest);
});

module.exports = router;
