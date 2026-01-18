#!/bin/bash

# Script to decode a bgcode file using the official libbgcode tool in Docker

if [ -z "$1" ]; then
    echo "Usage: $0 <bgcode-file> [output-gcode-file]"
    echo "Example: $0 media/files/bgcode/b07d5c5f-172c-3ba5-27f1-c449f96690bf.bgcode output.gcode"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-${INPUT_FILE%.bgcode}.gcode}"

# Get absolute paths
INPUT_ABS=$(realpath "$INPUT_FILE")
OUTPUT_DIR=$(dirname "$(realpath "$OUTPUT_FILE")")
OUTPUT_NAME=$(basename "$OUTPUT_FILE")

echo "Building Docker image..."
docker build -f Dockerfile.bgcode -t bgcode-decoder .

echo ""
echo "Decoding $INPUT_FILE..."
echo "Output will be: $OUTPUT_FILE"
echo ""

# Run the decoder
docker run --rm \
    -v "$INPUT_ABS:/data/input.bgcode:ro" \
    -v "$OUTPUT_DIR:/output" \
    bgcode-decoder \
    bgcode -i /data/input.bgcode -o /output/"$OUTPUT_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Successfully decoded to: $OUTPUT_FILE"
    echo "File size: $(wc -c < "$OUTPUT_FILE") bytes"
    echo "Lines: $(wc -l < "$OUTPUT_FILE")"
else
    echo ""
    echo "✗ Decoding failed"
    exit 1
fi
