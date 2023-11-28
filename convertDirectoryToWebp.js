const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function convertHeicToPng(inputFile, outputDir) {
    const outputFileName = path.basename(inputFile, path.extname(inputFile)) + '.png';
    const outputFile = path.join(outputDir, outputFileName);
    execSync(`convert "${inputFile}" "${outputFile}"`);
    return outputFile;
}


function compressToWebp(inputFile, outputDir) {
    // 生成最终的 WebP 文件名
    const outputFileName = path.basename(inputFile, path.extname(inputFile)) + '.webp';
    const outputFile = path.join(outputDir, outputFileName);

    // 创建一个临时文件路径，用于存储调整大小后的图片
    const tempOutputFile = path.join(outputDir, 'temp_' + path.basename(inputFile));

    // 首先，使用 convert 命令调整图片到 1080p 分辨率
    execSync(`convert "${inputFile}" -resize 1920x1080 "${tempOutputFile}"`);

    // 然后，将调整后的图片转换为 WebP 格式
    execSync(`cwebp -q 75 "${tempOutputFile}" -o "${outputFile}"`);

    // 可选：删除临时文件
    fs.unlinkSync(tempOutputFile);
}

// 使用示例
// compressToWebp('path/to/your/input/file.jpg', 'path/to/output/directory');


function copyFileToBackup(inputFile, backupDir) {
    const backupFile = path.join(backupDir, path.basename(inputFile));
    fs.copyFileSync(inputFile, backupFile);
    fs.unlinkSync(inputFile);
}

function processImages(inputDir, outputDir, backupDir) {
    const files = fs.readdirSync(inputDir);
    const supportedExtensions = ['.heic', '.png', '.jpg', '.jpeg']; // 添加其他支持的图片格式
    files.forEach(file => {
        const fileExt = path.extname(file).toLowerCase();

        if (!supportedExtensions.includes(fileExt)) {
            return; // 如果文件不是支持的格式，跳过处理
        }

        const inputFile = path.join(inputDir, file);

        if (fileExt === '.heic') {
            // 转换 HEIC 到 PNG
            const convertedFile = convertHeicToPng(inputFile, outputDir);
            // 压缩转换后的 PNG 到 WEBP
            compressToWebp(convertedFile, outputDir);
            // 删除中间的 PNG 文件
            fs.unlinkSync(convertedFile);
        } else {
            // 压缩其他格式的图片到 WEBP
            compressToWebp(inputFile, outputDir);
        }
        // 复制原始文件到备份目录并删除原文件
        copyFileToBackup(inputFile, backupDir);
    });
}




function convertDirectoryToWebp(directory) {
    const supportedExtensions = ['.heic', '.png', '.jpg', '.jpeg']; // 支持的图片格式

    // 递归遍历目录
    function processDirectory(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        items.forEach(item => {
            const fullPath = path.join(dir, item.name);

            if (item.isDirectory()) {
                // 如果是目录，递归处理
                processDirectory(fullPath);
            } else {
                // 处理文件
                const fileExt = path.extname(item.name).toLowerCase();
                if (supportedExtensions.includes(fileExt)) {
                    processFile(fullPath, fileExt, dir);
                }
            }
        });
    }

    function processFile(filePath, fileExt, outputDir) {
        if (fileExt === '.heic') {
            // 转换 HEIC 到 PNG，然后到 WEBP
            const pngFile = convertHeicToPng(filePath, outputDir);
            compressToWebp(pngFile, outputDir);
            fs.unlinkSync(pngFile); // 确保删除中间的 PNG 文件
            fs.unlinkSync(filePath); // 删除原始的 HEIC 文件
        } else {
            // 直接转换到 WEBP
            compressToWebp(filePath, outputDir);
            fs.unlinkSync(filePath); // 删除原始文件
        }
    }


    processDirectory(directory);
}




// 调用函数处理图片
const inputPath = '/app/input';
convertDirectoryToWebp(inputPath);
