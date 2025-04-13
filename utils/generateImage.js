const Jimp = require("jimp");
const path = require("path");
const fs = require("fs");

const generateInitialsImage = async (name, userId) => {
    const initials = name
        .split(" ")
        .map(part => part[0].toUpperCase())
        .slice(0, 2)
        .join("");

    const image = await Jimp.create(256, 256, "#ffffff");
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);

    image.print(
        font,
        0,
        0,
        {
            text: initials,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        },
        image.bitmap.width,
        image.bitmap.height
    );

    const profileDir = path.join(__dirname, "../profile_pictures");
    if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
    }

    const filePath = path.join(profileDir, `${userId}.jpg`);
    await image.quality(80).writeAsync(filePath);
    return filePath;
};

module.exports = { generateInitialsImage };