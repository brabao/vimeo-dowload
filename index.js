import path from 'path'
import url from 'url'
import fs from 'fs'
import axios from 'axios'
import atob from 'atob'

const MASTER_JSON_URL = ''
const DESTINATION_FOLDER = path.join(__dirname, 'output')

const Init = async () => {

  if (fs.existsSync(DESTINATION_FOLDER)) {
    const files = fs.readdirSync(DESTINATION_FOLDER);
    const unlinkPromises = files.map(filename => fs.unlinkSync(`${path.join(DESTINATION_FOLDER, filename)}`));
    await Promise.all(unlinkPromises);
  } else {
    fs.mkdirSync(DESTINATION_FOLDER);
  }


  const result = await axios.get(MASTER_JSON_URL)
  const dados = result.data
  const baseURL = url.resolve(MASTER_JSON_URL, result.data.base_url)

  download(baseURL, dados.video, 'video.mp4')
  download(baseURL, dados.audio, 'audio.mp3')
}

const download = async  (baseURL, content, filename) => {
  try {

    const item = content[0]
    const itemBaseUrl = url.resolve(baseURL, item.base_url)
    //const initSegment = new Buffer(item['init_segment'], 'base64').toString('ascii')
    const initSegment = atob(item['init_segment'])


    fs.writeFileSync(path.join(DESTINATION_FOLDER, filename), initSegment, { flag: 'a+' })

    for (let segment of item.segments) {
      const segmentUrl = url.resolve(itemBaseUrl, segment.url)
      console.log(`Baixando segmento: ${segmentUrl}`)
      const result = await axios.get(segmentUrl)
      fs.writeFileSync(path.join(DESTINATION_FOLDER, filename), result.data, { flag: 'a+' })

    }
  } catch (err) {
    console.log(err)
  }
}

Init()

//ffmpeg -i "audio.mp3" -i "video.mp4" -acodec copy -vcodec copy final.mp4
//ffmpeg video.mp4 -vcodec copy final.mp4

/*
ffmpeg \
- i audio.mp3 \
-i video.mp4 \
-f alsa -i pulse \
-vcodec libx264 -b 5000k \
-acodec aac -strict experimental \
-af highpass=f=20,lowpass=f=3000 \
-s hd720 -ab 320k -r 25 -g 25 -threads 0
output.mp4
*/