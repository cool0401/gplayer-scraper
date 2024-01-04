import gplay from "google-play-scraper";
import fs from "fs";
import axios from "axios";
import path from "path";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as randomWords from "random-words";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const downloadFile = async (url, outputPath) => {
    const response = await axios.get(url, { responseType: 'stream' });
    response.data.pipe(fs.createWriteStream(outputPath));
};

const save = async (appData) => {
    const folderPath = path.join(__dirname, 'images', appData.appId);
    fs.mkdirSync(folderPath, { recursive: true });

    if (appData.icon) {
        // Download and save the app icon
        const iconPath = path.join(folderPath, 'icon.png');
        await downloadFile(appData.icon, iconPath);
    }

    if (appData.screenshots) {
        // Download and save screenshots
        await Promise.all(appData.screenshots.map(async (screenshotUrl, index) => {
            const screenshotPath = path.join(folderPath, `screenshot_${index + 1}.png`);
            await downloadFile(screenshotUrl, screenshotPath);
        }));
    }

    //if (appData.video) {
        // Download and save video
    //    const videoPath = join(folderPath, 'video.mp4');
    //    await downloadFile(appData.video, videoPath);
    //    console.log(`Downloaded and saved video: ${videoPath}`);
    //}

    if (appData.videoImage) {
        // Download and save video image
        const imagePath = join(folderPath, 'video_image.jpg');
        const imageResponse = await axios.get(appData.videoImage, { responseType: 'arraybuffer' });
        fs.writeFileSync(imagePath, imageResponse.data);
        console.log(`Downloaded and saved video image: ${imagePath}`);
    }
};

// Initialize a set to store used appIDs
const usedAppIds = new Set();

const writeLog = async (dataObject, usedWord) => {
    const filePath = usedWord + '.json';
    console.log(dataObject.length);

    // Filter the array to keep only unique items based on the app ID
    const uniqueDataObject = dataObject.filter((item) => {
        // Check if the app ID is not in the set
        if (!usedAppIds.has(item.appId)) {
            // Add the app ID to the set (marking it as seen)
            usedAppIds.add(item.appId);
            return true; // Include the item in the filtered array
        }
        return false; // Exclude the item from the filtered array
    });

    const jsonString = JSON.stringify(uniqueDataObject, null, 2);

    for (let i = 0; i < uniqueDataObject.length; i++) {
        await save(dataObject[i]);
    }

    fs.appendFile(filePath, jsonString, (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        } else {
            console.log(`Object has been appended to ${filePath}`);
        }
    });

    // Add the used word to the list
    usedWords.push(usedWord);
};

// Keep track of used words
const usedWords = [];

// Function to get a unique random word
const getUniqueRandomWord = () => {
    let randomWord;
    do {
        randomWord = randomWords.generate();
    } while (usedWords.includes(randomWord));
    return randomWord;
};

// Specify the number of unique random words you want
const numberOfUniqueWords = 200000;

// Use a while loop to generate and save unique random words
let count = 0;
while (count < numberOfUniqueWords) {
    const randomWord = getUniqueRandomWord();
    console.log(randomWord);

    await gplay.search({
        term: randomWord,
        fullDetail: true,
        num: 250
    }).then((dataObject) => writeLog(dataObject, randomWord), (dataObject) => writeLog(dataObject, randomWord));

    count++;
}
