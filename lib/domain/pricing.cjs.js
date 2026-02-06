// CommonJS wrapper that ensures ts-node register is loaded and then exports the TS module.
let mod = null;
try {
  // Try to enable ts-node and load the TS module
  try {
    require('ts-node/register');
  } catch (e) {
    // ts-node not available or not needed
  }
  mod = require('./pricing.ts');
} catch (err) {
  // Fallback: require runtime JS copy
  try {
    mod = require('./pricing.runtime.js');
  } catch (err2) {
    throw new Error('Unable to load pricing module (ts or runtime): ' + err.message + ' / ' + err2.message);
  }
}

module.exports = mod;
