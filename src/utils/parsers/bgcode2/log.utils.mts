function logHex(
  buffer: Buffer,
  maxBytes = 256
) {
  if (!buffer?.length) {
    console.warn("Buffer empty");
    return
  }
  if (buffer.length > maxBytes) {
    console.warn("Too large");
    return
  }
  const slice = buffer.subarray(0, maxBytes);
  console.log(slice.toString("hex").match(/.{1,2}/g)?.join(" "));
}

function logHexTable(
  buffer: Buffer,
  bytesPerRow = 16,
  maxRows = 16
) {
  const maxBytes = bytesPerRow * maxRows;
  const slice = buffer.subarray(0, maxBytes);

  for (let i = 0; i < slice.length; i += bytesPerRow) {
    const row = slice.subarray(i, i + bytesPerRow);
    const hex = [...row].map(b => b.toString(16).padStart(2, "0")).join(" ");
    const ascii = [...row]
      .map(b => (b >= 0x20 && b <= 0x7E ? String.fromCharCode(b) : "."))
      .join("");

    console.log(
      i.toString(16).padStart(8, "0"),
      hex.padEnd(bytesPerRow * 3),
      ascii
    );
  }
}
