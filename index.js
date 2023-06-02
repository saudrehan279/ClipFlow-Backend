const express = require("express");
const cors = require("cors");
const youtubedl = require('youtube-dl-exec');

const port = 3000;
const app = express();

app.use(cors({
     origin: true
}));

app.get("/", async (req, res) => {
     res.status(200).send("This site is working!")
})

app.get("/getUrls", async (req, res) => {
     try {
          let url = req.query.url

          const options = {
               dumpSingleJson: true,
               noCheckCertificates: true,
               noWarnings: true,
               preferFreeFormats: true,
          };

          const data = await youtubedl(url, options);
          let arr = [];

          data.formats.map(item => {
               if (item.audio_channels === undefined) {
                    arr.push({
                         ...item,
                         thumbnail: data.thumbnail,
                         title: data.title,
                         extractor_key: data.extractor_key,
                         download: false,
                    })
               }
               else if (item.audio_channels != null) {
                    arr.push({
                         ...item,
                         thumbnail: data.thumbnail,
                         title: data.title,
                         extractor_key: data.extractor_key
                    })
               }
          })

          res.status(200).send(arr)
     } catch (error) {
          console.log(error)
          res.status(500).send(error)
     }
})

app.listen(port, () => {
     console.log(`Server running at http://localhost:${port}`)
})