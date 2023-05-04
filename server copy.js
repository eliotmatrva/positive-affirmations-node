require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;

function getTimeStamp(){
    let today = new Date();
    let month = today.getMonth() + 1;
    if (month < 10){
        month = `0${month}`;
    }
    let day = today.getDate();
    if (day < 10) {
        day = `0${day}`;
    }
    let year = today.getFullYear();
    let hour = today.getHours();
    let minute = today.getMinutes();
    let seconds = today.getSeconds();
    if (seconds < 10 ) {
        seconds = `0${seconds}`
    }
    if (minute < 10) {
        minute = `0${minute}`
    }
    if (hour < 10) {
        hour = `0${hour}`
    }
    return `${year}${month}${day}-${hour}${minute}${seconds}`;

}

/******* START OPENAI STUFF *********/
let oapiModelsUrl = 'https://api.openai.com/v1/models';
let oapiCompletionUrl = 'https://api.openai.com/v1/completions';

let myBody = {
    model: "text-davinci-002",
    prompt: "write a positive affirmation that rhymes, in the style of Dr. Seuss",
    max_tokens: 512,
    temperature: 0.5,
    top_p: 1,
    n: 1,
    stream: false,
    logprobs: null
}

let openAiHeaders = new Headers();
openAiHeaders.append('Authorization', `Bearer ${process.env.openAiApiKey}`);
openAiHeaders.append('Content-Type', 'application/json');

let openApiPrompt = 'write a positive affirmation that rhymes, in the style of Dr. Seuss.';
let openAiOptions = {
    method: 'POST',
    headers: openAiHeaders,
    body: JSON.stringify({
        "model": "text-davinci-003",
        "prompt": openApiPrompt,
        "max_tokens": 100,
        "temperature": 0.5,
        "top_p": 1,
        "n": 1,
        "stream": false,
        "logprobs": null
    })
}

function writeAffirmationIndexFile(indexJson, prompt, completion, timeStamp){
    let promptFileIndex = JSON.parse(fs.readFileSync(indexJson));
    promptFileIndex.push({ timeStamp: timeStamp, prompt: prompt, affirmation: completion});
    
    fs.writeFileSync(indexJson, JSON.stringify(promptFileIndex));
}

async function fetchAffirmation(options) {
    let response = await fetch(oapiCompletionUrl, options);
    let data = await response.json();
    let affirmation = data.choices[0].text;
    let myData = JSON.stringify(data);
    console.log(affirmation);
    let timeStamp = getTimeStamp();
    writeAffirmationIndexFile('prompt-and-affirmation-index.json', openApiPrompt, affirmation, timeStamp);
}

fetchAffirmation(openAiOptions);
/******* END OPENAI STUFF *********/

/******* START STABILITYAI STUFF *********/

let samplerList = [
    "DDIM",
    "DDPM",
    "K_DPMPP_2M",
    "K_DPMPP_2S_ANCESTRAL",
    "K_DPM_2",
    "K_DPM_2_ANCESTRAL",
    "K_EULER",
    "K_EULER_ANCESTRAL",
    "K_HEUN",
    "K_LMS"
];

let engineId = 'stable-diffusion-xl-beta-v2-2-2';

let reqHeaders = new Headers();
    reqHeaders.append('Authorization', `Bearer ${process.env.stabilityApiKey}`);
    reqHeaders.append('Content-Type', 'application/json');

// discord links for generate image:  https://discord.com/channels/1002292111942635562/1042896447311454361/1096559685974368298
let imagePrompt = "A dr seuss style character, cartoon, smiling, zen buddhism";
// let imagePrompt = "A dramatic painting of massive lightning storm in the night sky above a pirate ship, ultra detailed";

function writeIndexFile(indexJson, prompt, timeStamp){
    let promptFileIndex = JSON.parse(fs.readFileSync(indexJson));
    promptFileIndex.push({ imageFileName: `image${timeStamp}.png`, prompt: `${prompt}`});
    fs.writeFileSync(indexJson, JSON.stringify(promptFileIndex));
}

async function generateImage(engineId, prompt) {
    console.log(`engine id is ${engineId}`)
    let endpoint = `https://api.stability.ai/v1/generation/${engineId}/text-to-image/`
    let body = JSON.stringify({
        "cfg_scale": 7,
        "height": 512,
        "width": 512,
        "samples": 1,
        "steps": 50,
        "text_prompts": [{
            "text": prompt,
            "weight": 1
        }]
    });
    let options = {
        method: 'POST',
        headers: reqHeaders,
        body: body
    }
    let response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-beta-v2-2-2/text-to-image', options);
    let data = await response.json();
    //fs.writeFileSync('base64Encoded.txt', data.artifacts[0].base64, {encoding: 'base64'});
    let timeStamp = getTimeStamp();
    writeIndexFile('prompt-and-file-index.json', prompt, timeStamp);
    fs.writeFile(`image${getTimeStamp()}.png`, data.artifacts[0].base64, {encoding: 'base64'}, function(err) {`error during writeFile: "${err}"`
    });
    console.log(`image${getTimeStamp()}.png generated and saved!`)
    // base64_decode(data,'generatedImage.jpg');
    //console.log(data.artifacts[0].base64);
}

async function getEngines(){
    let options = {
        method: 'GET',
        headers: reqHeaders
    }
    let response = await fetch('https://api.stability.ai/v1/engines/list', options);
    let data = await response.json();
    console.log(data);
}

generateImage('stable-diffusion-xl-beta-v2-2-2', imagePrompt);

/******* END STABILITYAI STUFF *********/

app.get('/api/getLatestAffirmation', async (req, res) => {
    let affirmationList = JSON.parse(fs.readFileSync('./prompt-and-affirmation-index.json', 'utf8'));
        
    function compareFileNames(a,b) {
        if (a.timeStamp > b.timeStamp) {
            return -1;
        } else if (a.timeStamp < b.timeStamp){
            return 1;
        } else {
            return 0;
        }
    };

    let sorted = await affirmationList.sort(compareFileNames);
    let affirmation = sorted[0].affirmation;
    console.log(affirmation);
    res.send(affirmation);
});

app.get('/api/getLatestImage', async (req, res) => {
    let imageList = JSON.parse(fs.readFileSync('./prompt-and-file-index.json', 'utf8'));
    console.log(typeof(imageList));
    
    function compareFileNames(a,b) {
        if (a.imageFileName > b.imageFileName) {
            return -1;
        } else if (a.imageFileName < b.imageFileName){
            return 1;
        } else {
            return 0;
        }
    };
    let sorted = imageList.sort(compareFileNames);
    console.log(JSON.stringify(sorted[0]));
    res.sendFile(`${sorted[0].imageFileName}`, {root: __dirname});
})

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
})