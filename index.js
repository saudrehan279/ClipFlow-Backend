const express = require("express");
const cors = require("cors");
const youtubedl = require('youtube-dl-exec');

const port = process.env.PORT || 4000;
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).send("ClipFlow Backend is running!");
});

/**
 * Filter and format video/audio data for the frontend.
 * @param {Object} data - Raw data from youtube-dl-exec
 */
const formatDataOutput = (data) => {
    const { formats, extractor, thumbnail, title, extractor_key } = data;
    const results = [];

    if (!formats || formats.length === 0) return results;

    switch (extractor.toLowerCase()) {
        case "youtube":
            formats.forEach((item) => {
                if (item.audio_channels !== null) {
                    // Include high-quality audio (M4A/Opus) and video with audio
                    if ((item.resolution === "audio only" && (item.format_id === "251" || item.ext === "m4a")) ||
                        (item.resolution !== "audio only" && Number(item.height) >= 144)) {
                        results.push({
                            ...item,
                            thumbnail,
                            title,
                            extractor_key
                        });
                    }
                }
            });
            break;

        case "facebook":
        case "twitter":
        case "instagram":
            formats.forEach(item => {
                // Return all valid formats for these platforms, usually they have fewer options
                if (item.url) {
                    results.push({
                        ...item,
                        thumbnail,
                        title,
                        extractor_key,
                        download: true
                    });
                }
            });
            break;

        case "tiktok":
            // TikTok usually returns a single best format
            const bestTikTok = formats.sort((a,b) => (b.quality || 0) - (a.quality || 0))[0];
            if (bestTikTok) {
                results.push({
                    ...bestTikTok,
                    thumbnail,
                    title,
                    extractor_key
                });
            }
            break;

        default:
            // Generic fallback for other extractors
            return formats.map(f => ({ ...f, thumbnail, title, extractor_key }));
    }

    return results;
};

app.get("/getUrls", async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        const options = {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        };

        const data = await youtubedl(url, options);
        const filteredData = formatDataOutput(data);

        res.status(200).send(filteredData);
    } catch (error) {
        console.error("Extraction error:", error);
        res.status(500).json({ 
            error: "Failed to extract video details", 
            message: error.stderr || error.message 
        });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${port}`);
});