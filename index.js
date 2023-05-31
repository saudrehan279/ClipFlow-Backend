const express = require("express");
const cors = require("cors");
const youtubedl = require('youtube-dl-exec');

const port = 3000;
const app = express();

app.use(cors({
     origin: true
}));

app.get("/", async (req, res) => {
     res.status(200).send("OK")
})

app.get("/getUrls", async (req, res) => {
     try {
          // let url = "https://www.youtube.com/watch?v=jJvQEtYvwTk";
          let url = req.query.url

          const options = {
               dumpSingleJson: true,
               noCheckCertificates: true,
               noWarnings: true,
          };

          const data = await youtubedl(url, options);

          res.status(200).send(data)
     } catch (error) {
          res.status(500).send(error)
     }
})

app.listen(port, () => {
     console.log(`Server running at http://localhost:${port}`)
})