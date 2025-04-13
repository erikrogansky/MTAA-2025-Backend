const { createCanvas } = require("canvas");
const path = require("path");
const fs = require("fs");

const backgroundColors = [
    "#FFB900", "#D83B01", "#B4009E", "#5C2D91",
    "#0078D7", "#00B4FF", "#008272", "#107C10"
];

const getContrastTextColor = (bgColor) => {
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#FFFFFF";
};

const generateInitialsImage = async (name, userId) => {
    const width = 256;
    const height = 256;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Choose a random background color
    const backgroundColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
    const textColor = getContrastTextColor(backgroundColor);

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const safeName = name.trim() || "U";
    const parts = safeName.split(" ").filter(Boolean);
    const initials = parts.slice(0, 2).map(p => p[0].toUpperCase()).join("") || "U";

    ctx.fillStyle = textColor;
    ctx.font = "bold 128px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, width / 2, height / 2);

    const safeUserId = userId.replace(/[^\w\-]/g, "_");
    const profileDir = path.join(__dirname, "../profile_pictures");
    if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
    }

    const filePath = path.join(profileDir, `${safeUserId}.jpg`);
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.8 });
    fs.writeFileSync(filePath, buffer);

    return filePath;
};

module.exports = { generateInitialsImage };
