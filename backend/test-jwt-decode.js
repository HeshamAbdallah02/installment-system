// Quick script to decode JWT token
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-jwt-decode.js <token>');
  process.exit(1);
}

// JWT is base64url encoded, split by dots
const parts = token.split('.');
if (parts.length !== 3) {
  console.log('Invalid JWT format');
  process.exit(1);
}

// Decode header and payload (skip signature)
const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

console.log('JWT Header:', JSON.stringify(header, null, 2));
console.log('\nJWT Payload:', JSON.stringify(payload, null, 2));

// Convert timestamps to readable dates
if (payload.iat) {
  console.log('\nIssued At:', new Date(payload.iat * 1000).toISOString());
}
if (payload.exp) {
  console.log('Expires At:', new Date(payload.exp * 1000).toISOString());
  const hoursUntilExpiry = (payload.exp - payload.iat) / 3600;
  console.log(`Token Lifetime: ${hoursUntilExpiry} hours`);
}
