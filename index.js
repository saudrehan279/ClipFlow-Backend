const express = require("express");
const cors = require("cors");

const port = 3000;
const app = express();

app.use(cors({
     origin: true
}));

app.get("/", async (req, res) => {
     res.status(200).send("Working!")
})

app.listen(port, () => {
     console.log(`Server running at http://localhost:${port}`)
})