function base64urlEncode(data: string | Uint8Array): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let binString = "";
  for (let i = 0; i < bytes.length; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const passwordBuffer = new TextEncoder().encode(password);
  const saltBuffer = new TextEncoder().encode(salt);
  
  const key = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );
  
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signJwt(payload: any, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  const message = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  
  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  
  return `${message}.${encodedSignature}`;
}

export async function verifyJwt(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [headerPart, payloadPart, signaturePart] = parts;
    const message = `${headerPart}.${payloadPart}`;
    
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signatureBytes = base64urlDecode(signaturePart);
    const messageBytes = new TextEncoder().encode(message);
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as any,
      messageBytes
    );
    
    if (!isValid) return null;
    
    const payloadJson = new TextDecoder().decode(base64urlDecode(payloadPart));
    const payload = JSON.parse(payloadJson);
    
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}
