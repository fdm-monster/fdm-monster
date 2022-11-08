const { promisify } = require("util");
const lineReader = require("line-reader");
const fs = require("fs");
const util = require("util");
const readline = require("readline");
const stream = require("stream");
const rename = util.promisify(fs.rename);
const unlink = util.promisify(fs.unlink);

function lineReplace({ file, lineIndex, text, addNewLine = true, callback, errorCallback }) {
  const readStream = fs.createReadStream(file);
  const tempFile = `${file}.tmp`;
  const writeStream = fs.createWriteStream(tempFile);
  const rl = readline.createInterface(readStream, stream);
  let replacedText;

  readStream.on("error", async ({ message }) => {
    await unlink(tempFile);
    errorCallback({ error: message, file, lineIndex, replacedText, text });
  });

  writeStream.on("error", async ({ message }) => {
    await unlink(tempFile);
    errorCallback({ error: message, file, lineIndex, replacedText, text });
  });

  rl.on("error", async ({ message }) => {
    await unlink(tempFile);
    errorCallback({ error: message, file, lineIndex, replacedText, text });
  });

  let currentLineNumber = 0;
  rl.on("line", (originalLine) => {
    ++currentLineNumber;

    // Replace.
    if (currentLineNumber === lineIndex + 1) {
      replacedText = originalLine;
      if (addNewLine) return writeStream.write(`${text}\n`);
      return writeStream.write(`${text}`);
    }

    // Save original line.
    writeStream.write(`${originalLine}\n`);
  });

  rl.on("close", () => {
    // Finish writing to temp file and replace files.
    // Replace original file with fixed file (the temp file).
    writeStream.end(async () => {
      try {
        await unlink(file); // Delete original file.
        await rename(tempFile, file); // Rename temp file with original file name.
      } catch (error) {
        errorCallback({ error, file, lineIndex, replacedText, text });
        return;
      }

      callback({ file, lineIndex, replacedText, text });
    });
  });
}

async function lineReplaceAsync({ file, lineIndex, text, addNewLine = true }) {
  await new Promise((resolve, reject) => {
    lineReplace({ file, lineIndex, addNewLine, text, callback: resolve, errorCallback: reject });
  });
}

const lineReaderPromise = promisify(lineReader.eachLine);

async function readLinesAsync(pathOrFh, lineCount = -1, endPredicate = null, unlimited = false) {
  let currentLineIndex = 0;
  const hasEndPredicate = typeof endPredicate === "function";
  const hasLineCount = lineCount > 0;
  if (!hasEndPredicate && !hasLineCount && !unlimited) {
    throw new Error(
      "No line limit or end condition provided when unlimited was also false. This is illegal"
    );
  }
  const lines = [];
  await lineReaderPromise(pathOrFh, function (line) {
    currentLineIndex++;

    if (hasLineCount && currentLineIndex >= lineCount) return false;
    if (hasEndPredicate) {
      endPredicate(line, lines, currentLineIndex, lineCount);
    }
    lines.push(line);
  });

  return lines;
}

module.exports = {
  readLinesAsync,
  lineReplaceAsync,
};
