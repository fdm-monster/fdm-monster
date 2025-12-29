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

By default, the server generates a minimal placeholder JPEG frame. To use your own images:

1. Navigate to the frames directory: `dist/consoles/camera-frames/`
2. Add one or more `.jpg`, `.jpeg`, or `.png` files to this directory
3. Restart the server
4. The server will cycle through your custom frames

Example:
```bash
# Create the directory (if it doesn't exist)
mkdir -p dist/consoles/camera-frames

# Add your images (examples - supports both JPEG and PNG)
cp /path/to/frame1.jpg dist/consoles/camera-frames/
cp /path/to/frame2.png dist/consoles/camera-frames/
cp /path/to/frame3.jpg dist/consoles/camera-frames/

# Run the server
yarn console:mock-camera
```

## Generating Video Frames

If you want to create frames from a video file, you can use FFmpeg:

```bash
# Extract frames at 10 FPS
ffmpeg -i video.mp4 -vf fps=10 dist/consoles/camera-frames/frame_%04d.jpg

# Extract frames with specific quality
ffmpeg -i video.mp4 -vf fps=10 -q:v 2 dist/consoles/camera-frames/frame_%04d.jpg
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
- The server automatically creates the `camera-frames` directory on first run
- Each frame's content type is automatically detected based on file extension
- For best results, use images with consistent dimensions
- PNG frames support transparency, but note that not all MJPEG clients handle PNG well

## Troubleshooting

If you see a very small gray square instead of your images:
1. Check that your `.jpg` files are in the correct directory
2. Verify the files are valid JPEG images
3. Check the console output for any error messages
4. Try restarting the server after adding images
