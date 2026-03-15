# Mock Camera Server

A simple MJPEG camera stream server for testing and development.

## Usage

### Basic Usage

Run the mock camera server with default settings (port 8080, 10 FPS):

```bash
yarn console:mock-camera
```

### Custom Port and FPS

```bash
yarn console:mock-camera <port> <fps>
```

Examples:
```bash
yarn console:mock-camera 8081 15    # Port 8081, 15 FPS
yarn console:mock-camera 8080 30    # Port 8080, 30 FPS
```

## Endpoints

- **MJPEG Stream**: `http://localhost:8080/`
  - Returns continuous MJPEG video stream
  - Compatible with most video players and browser `<img>` tags

- **Snapshot**: `http://localhost:8080/snapshot`
  - Returns a single JPEG image
  - Useful for testing single frame capture

- **Status**: `http://localhost:8080/status`
  - Returns JSON status information
  - Shows FPS, custom frames count, and frames directory

## Using Custom Frames

By default, the server uses an embedded default JPEG frame. To use your own images:

1. The frames directory will be created automatically at: `media/mock-camera/`
2. Add one or more `.jpg`, `.jpeg`, or `.png` files to this directory
3. Restart the server
4. The server will cycle through your custom frames

Example:
```bash
# Create the directory
mkdir -p media/mock-camera

# Add your images (examples - supports both JPEG and PNG)
cp /path/to/frame1.jpg media/mock-camera/
cp /path/to/frame2.png media/mock-camera/
cp /path/to/frame3.jpg media/mock-camera/

# Run the server
yarn console:mock-camera
```

## Updating the Default Embedded Image

The mock camera includes an embedded default image that is used as a fallback when no custom frames exist. To update this default image:

1. Place your new default image as `default.jpg` in the `src/consoles/mock-camera/` directory
2. Run the following command to regenerate the base64-encoded image file:

```bash
node -e "const fs = require('fs'); const img = fs.readFileSync('src/consoles/mock-camera/default.jpg'); const b64 = img.toString('base64'); fs.writeFileSync('src/consoles/mock-camera/default-image.ts', '// Auto-generated file - do not edit manually\n// This file contains the default camera frame image as base64\n\nexport const DEFAULT_IMAGE_BASE64 = \"' + b64 + '\";\n');"
```

3. The `default-image.ts` file will be updated with the new base64 data
4. Rebuild the project to include the new default image

**Note:** The `default.jpg` file is not committed to the repository. Only the generated `default-image.ts` file is tracked.

## Generating Video Frames

If you want to create frames from a video file, you can use FFmpeg:

```bash
# Extract frames at 10 FPS
ffmpeg -i video.mp4 -vf fps=10 media/mock-camera/frame_%04d.jpg

# Extract frames with specific quality
ffmpeg -i video.mp4 -vf fps=10 -q:v 2 media/mock-camera/frame_%04d.jpg
```

## Testing the Stream

### In Browser

Open in your browser:
```
http://localhost:8080/
```

### Using curl

```bash
# View stream
curl http://localhost:8080/

# Get snapshot
curl http://localhost:8080/snapshot -o snapshot.jpg

# Check status
curl http://localhost:8080/status
```

### In HTML

```html
<img src="http://localhost:8080/" alt="Camera Stream">
```

### Using VLC or other media players

```bash
vlc http://localhost:8080/
```

## Notes

- The server uses multipart streaming format (commonly known as MJPEG), which is widely supported
- Supports both JPEG (.jpg, .jpeg) and PNG (.png) image formats
- Custom frames are cycled through based on timestamp (changes every second)
- The server automatically creates the `media/mock-camera` directory on first run
- A default image is embedded in the compiled code and used as fallback when no custom frames exist
- Each frame's content type is automatically detected based on file extension
- For best results, use images with consistent dimensions
- PNG frames support transparency, but note that not all MJPEG clients handle PNG well

## Troubleshooting

If you see a very small gray square instead of your images:
1. Check that your `.jpg` files are in the correct directory
2. Verify the files are valid JPEG images
3. Check the console output for any error messages
4. Try restarting the server after adding images
