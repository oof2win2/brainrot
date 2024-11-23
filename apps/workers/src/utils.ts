export function arrayBufferToBase64(buffer: ArrayBuffer) {
  // Convert ArrayBuffer to Uint8Array
  const uint8Array = new Uint8Array(buffer);

  // Convert the Uint8Array to a binary string
  let binaryString = '';
  uint8Array.forEach(byte => {
    binaryString += String.fromCharCode(byte);
  });

  // Convert the binary string to Base64
  return btoa(binaryString);
}
