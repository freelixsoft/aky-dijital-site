function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derivePasswordHash(password: string, salt: Uint8Array) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits"
  ]);
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: 120000
    },
    keyMaterial,
    256
  );

  return bytesToBase64(new Uint8Array(bits));
}

export async function createPasswordVerifier(password: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return {
    passwordSalt: bytesToBase64(salt),
    passwordHash: await derivePasswordHash(password, salt)
  };
}

export async function verifyPassword(password: string, passwordSalt: string, passwordHash: string) {
  const nextHash = await derivePasswordHash(password, base64ToBytes(passwordSalt));
  return nextHash === passwordHash;
}
