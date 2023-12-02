import fs from "fs";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { connect } from "mongoose";
import { fetchMongoDBConnectionString } from "@/server.env";
import { SettingsStore } from "@/state/settings.store";

const Parser = require("stream-parser");
const inherits = require("util").inherits;
const Transform = require("stream").Transform;

// create a "Throttle" instance that reads at 1 b/s
function Throttle(opts) {
  if (!(this instanceof Throttle)) return new Throttle(opts);

  if ("number" == typeof opts) opts = { bps: opts };
  if (!opts) opts = {};
  if (null == opts.lowWaterMark) opts.lowWaterMark = 0;
  if (null == opts.highWaterMark) opts.highWaterMark = 0;
  if (null == opts.bps) throw new Error('must pass a "bps" bytes-per-second option');
  if (null == opts.chunkSize) opts.chunkSize = (opts.bps / 10) | 0; // 1/10th of "bps" by default

  Transform.call(this, opts);

  this.bps = opts.bps;
  this.chunkSize = Math.max(1, opts.chunkSize);

  this.totalBytes = 0;
  this.startTime = Date.now();

  this._passthroughChunk();
}

inherits(Throttle, Transform);

/**
 * Mixin `Parser`.
 */

Parser(Throttle.prototype);

/**
 * Begins passing through the next "chunk" of bytes.
 *
 * @api private
 */

Throttle.prototype._passthroughChunk = function () {
  this._passthrough(this.chunkSize, this._onchunk);
  this.totalBytes += this.chunkSize;
};

/**
 * Called once a "chunk" of bytes has been passed through. Waits if necessary
 * before passing through the next chunk of bytes.
 *
 * @api private
 */

Throttle.prototype._onchunk = function (output, done) {
  const self = this;
  const totalSeconds = (Date.now() - this.startTime) / 1000;
  const expected = totalSeconds * this.bps;

  function d() {
    self._passthroughChunk();
    done();
  }

  if (this.totalBytes > expected) {
    // Use this byte count to calculate how many seconds ahead we are.
    const remainder = this.totalBytes - expected;
    const sleepTime = (remainder / this.bps) * 1000;
    //console.error('sleep time: %d', sleepTime);
    if (sleepTime > 0) {
      setTimeout(d, sleepTime);
    } else {
      d();
    }
  } else {
    d();
  }
};

// const throttle = new Throttle(10e6);
// const MY_FILE_PATH = "somefile.gcode";
// const { size } = fs.statSync(MY_FILE_PATH);

// // This posts the file to a server
// const fileStream = fs.createReadStream(MY_FILE_PATH);
// const upStream = axios({
//   method: "POST",
//   url: "http://localhost:3000/upload",
//   headers: {
//     "Content-Type": "image/jpeg",
//     "Content-Length": size,
//   },
//   data: fileStream.pipe(throttle),
//   onUploadProgress: (progressEvent) => {
//     console.log(progressEvent.loaded);
//   },
// });
// upStream
//   .catch((e) => {
//     console.error("Err");
//   })
//   .then(() => {
//     console.log("then");
//   });
// });

// // This sets up FDM Monster to do it for us
// connect(fetchMongoDBConnectionString(), {
//   serverSelectionTimeoutMS: 1500,
// }).then(async () => {
//   const container = configureContainer();
//   await container.resolve<SettingsStore>(DITokens.settingsStore).loadSettings();
//   const opService = container.resolve<OctoPrintApiService>(DITokens.octoPrintApiService);
//   await opService.uploadFileAsMultiPart(
//     {
//       apiKey: "123asd",
//       printerURL: "http://localhost:3000",
//     },
//     {
//       path: MY_FILE_PATH,
//       originalname: "file.fil",
//     },
//     {},
//     "123"
//   );
//   console.log("Done");
// });
