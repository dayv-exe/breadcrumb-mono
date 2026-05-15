#!/bin/bash
# generate_build_dirs.sh
# Run from the backend/ directory

set -euo pipefail

cd "$(dirname "$0")"

OUTPUT="build_dirs.txt"
> "$OUTPUT"

# Find all directories under cmd/ that contain a main.go file
for dir in cmd/*/; do
    if [ -f "${dir}main.go" ]; then
        # Strip "cmd/" prefix and trailing slash
        name=$(basename "$dir")
        echo "$name" >> "$OUTPUT"
    fi
done

# Sort for consistency
sort -o "$OUTPUT" "$OUTPUT"

echo "Generated $OUTPUT with $(wc -l < "$OUTPUT") entries:"
cat "$OUTPUT"