#!/usr/bin/env node

/**
 * Generate a strong random secret key for JWT_SECRET or other purposes
 * Usage: node generateSecret.js
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateSecureSecret(length = 32) {
  // More readable format with mixed characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let secret = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    secret += chars[randomIndex];
  }
  return secret;
}

console.log('\n🔐 JWT Secret Generator\n');
console.log('━'.repeat(60));

console.log('\n✨ Hex Format (64 chars):');
console.log(generateSecret(64));

console.log('\n✨ Mixed Format (32 chars):');
console.log(generateSecureSecret(32));

console.log('\n✨ Mixed Format (48 chars):');
console.log(generateSecureSecret(48));

console.log('\n━'.repeat(60));
console.log('\n💡 Tip: Copy any of the above and use it as JWT_SECRET\n');
