const express = require('express');
const router = express.Router();

// Farcaster Mini App Manifest
router.get('/farcaster.json', (req, res) => {
    const appUrl = process.env.APP_URL || `https://${req.get('host')}`;

    const manifest = {
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
