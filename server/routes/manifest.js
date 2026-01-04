const express = require('express');
const router = express.Router();

// Farcaster Mini App Manifest
router.get('/farcaster.json', (req, res) => {
    const appUrl = process.env.APP_URL || `https://${req.get('host')}`;
    
    const manifest = {
        accountAssociation: {
            header: "eyJmaWQiOjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIn0",
            payload: "eyJkb21haW4iOiJleGFtcGxlLmNvbSJ9",
            signature: "MHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw"
        },
        frame: {
            version: "1",
            name: "💣 Démineur",
            iconUrl: `${appUrl}/icon.png`,
            homeUrl: appUrl,
            imageUrl: `${appUrl}/og-image.png`,
            buttonTitle: "Jouer au Démineur",
            splashImageUrl: `${appUrl}/splash.png`,
            splashBackgroundColor: "#1a1a2e",
            webhookUrl: `${appUrl}/api/webhook`
        }
    };
    
    res.json(manifest);
});

module.exports = router;
