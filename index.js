const express = require("express");
const cors = require("cors");
const youtubedl = require('youtube-dl-exec');
const cheerio = require("cheerio");
const axios = require("axios")

const port = 4000;
const app = express();

app.use(cors({
     origin: true
}));

app.get("/", async (req, res) => {
     res.status(200).send("This site is working!")
})

function getVideoId(instagramUrl) {
     // Regular expression pattern to match the video ID
     const pattern = /(?:\/p\/|\/tv\/|\/reel\/|\/story\/|\/igtv\/)([A-Za-z0-9_-]+)/;

     // Attempt to find a match in the URL
     const match = instagramUrl.match(pattern);

     if (match) {
          const videoId = match[1];
          return videoId;
     } else {
          return null;
     }
}

const getInstalink = async (link) => {

     let videoId = getVideoId(link)


     let usableLink = `https://www.instagram.com/p/${videoId}/embed/captioned`
     let finalData = {};

     await axios({
          method: "GET",
          url: usableLink
     }).then((res) => {

          const $ = cheerio.load(res.data);

          let videoString;
          let thumbnail;
          let title;
          $('script').each((index, element) => {
               const scriptText = $(element).html();
               const match = scriptText.match(/\\"video_url\\":\\"(.*?)\\"/);
               const match2 = scriptText.match(/\\"display_url\\":\\"(.*?)\\"/);
               const match3 = scriptText.match(/\\"caption\\":\\"(.*?)\\"/);

               if (match2 && match2[1]) {
                    thumbnail = match2[1].replace(/\\/g, '');
               }

               if (match && match[1]) {
                    videoString = match[1].replace(/\\/g, '');
               }

               if (match3 && match3[1]) {
                    title = match3[1].replace(/\\/g, '').split(" ").slice(0, 3).join(" ");
               }
          })

          let obj = {
               url: videoString,
               thumbnail: thumbnail,
               title: title + "...",
               video_ext: "mp4",
               resolution: null,
               extractor_key: "Instagram",
               ext: "mp4"

          }

          finalData = obj

     }).catch((err) => {
          console.log(err)
     })

     return finalData

}

function isInstagramLink(link) {
     // Regular expression pattern to match Instagram URLs
     var regex = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w-]+\/)?(?:p|reel)\/[a-zA-Z0-9_-]+\/?(?:\?.*)?$/;

     return regex.test(link);
}

app.get("/getUrls", async (req, res) => {
     try {
          let url = req.query.url
          let arr = [];

          if (isInstagramLink(url)) {
               await getInstalink(url).then((a) => {
                    arr.push(a)
               }).catch((err) => {
                    res.status(500).send(err)
               })

               res.status(200).send(arr)

          } else {

               const options = {
                    dumpSingleJson: true,
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true,
               };

               const data = await youtubedl(url, options);
               // console.log("formats", data.formats)

               let hello = []

               // console.log(data.extractor)



               switch (data.extractor) {
                    case "youtube":
                         data.formats.map((item) => {
                              if (item.audio_channels != null) {
                                   if (item.resolution === "audio only" && item.format_id == "251") {
                                        hello.push({
                                             ...item,
                                             thumbnail: data.thumbnail,
                                             title: data.title,
                                             extractor_key: data.extractor_key
                                        })
                                   }
                                   else if (item.resolution != "audio only") {
                                        // console.log(Number(item.height) >= 144)
                                        if (Number(item.height) >= 144) {
                                             hello.push({
                                                  ...item,
                                                  thumbnail: data.thumbnail,
                                                  title: data.title,
                                                  extractor_key: data.extractor_key
                                             })
                                        }
                                   }
                              }
                         })
                         break

                    case "facebook":
                         data.formats.map(item => {
                              if (item.resolution == null) {
                                   if (item.audio_channels === undefined) {
                                        hello.push({
                                             ...item,
                                             thumbnail: data.thumbnail,
                                             title: data.title,
                                             extractor_key: data.extractor_key,
                                             download: false,
                                        })
                                   }
                                   else if (item.audio_channels != null) {
                                        hello.push({
                                             ...item,
                                             thumbnail: data.thumbnail,
                                             title: data.title,
                                             extractor_key: data.extractor_key
                                        })
                                   }
                              }
                         })
                         break

                    case "twitter":
                         data.formats.map((item) => {
                              if (item.quality === undefined) {
                                   hello.push({
                                        ...item,
                                        thumbnail: data.thumbnail,
                                        title: data.title,
                                        extractor_key: data.extractor_key,
                                        download: false,
                                   })
                              }
                         })
                         break
                    case "TikTok":
                         hello.push(data.formats.reverse()[0])
                         break
                    default:
                         hello = data.formats
                         break
               }

               res.status(200).send(hello)



               // if (data.extractor == "facebook") {
               //      data.formats.map(item => {
               //           if (item.resolution == null) {
               //                if (item.audio_channels === undefined) {
               //                     arr.push({
               //                          ...item,
               //                          thumbnail: data.thumbnail,
               //                          title: data.title,
               //                          extractor_key: data.extractor_key,
               //                          download: false,
               //                     })
               //                }
               //                else if (item.audio_channels != null) {
               //                     arr.push({
               //                          ...item,
               //                          thumbnail: data.thumbnail,
               //                          title: data.title,
               //                          extractor_key: data.extractor_key
               //                     })
               //                }
               //           }
               //      })
               // }
               // else {
               //      data.formats.map(item => {
               //           if (item.audio_channels === undefined) {
               //                arr.push({
               //                     ...item,
               //                     thumbnail: data.thumbnail,
               //                     title: data.title,
               //                     extractor_key: data.extractor_key,
               //                     download: false,
               //                })
               //           }
               //           else if (item.audio_channels != null) {
               //                arr.push({
               //                     ...item,
               //                     thumbnail: data.thumbnail,
               //                     title: data.title,
               //                     extractor_key: data.extractor_key
               //                })
               //           }
               //      })
               // }

               // res.status(200).send(arr)


          }
     } catch (error) {
          console.log(error)
          res.status(500).send(error)
     }
})



app.listen(port, '0.0.0.0', () => {
     console.log(`Server is running on http://0.0.0.0:${port}`);
});