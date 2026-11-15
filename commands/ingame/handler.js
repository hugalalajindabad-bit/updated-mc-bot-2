const fs = require('fs');
const path = require('path');

// Edit this one list to manage all commands with allowList: true.
const ALLOWED_PLAYERS = ['SUJOY8534'];
const commands = new Map();
const commandDir = path.join(__dirname, 'minecraft');
for (const file of fs.readdirSync(commandDir).filter(name => name.endsWith('.js'))) {
  const command = require(path.join(commandDir, file));
  if (!command.name || typeof command.execute !== 'function') { console.warn(`[COMMAND] Skipping invalid command: ${file}`); continue; }
  commands.set(command.name.toLowerCase(), command);
}
function handleIngameCommand(bot, username, message) {
  if (typeof message !== 'string' || !message.startsWith('?')) return;
  const parts = message.slice(1).trim().split(/\s+/);
  const name = (parts.shift() || '').toLowerCase();
  if (!name) return;
  const command = commands.get(name);
  if (!command) return;
  console.log(username);
  if (command.allowList === true && !ALLOWED_PLAYERS.some(player => player.toLowerCase() === username.toLowerCase())) return;
  if (command.allowList !== true && command.allowList !== false) { console.error(`[COMMAND] ${name}: allowList must be true or false.`); return; }
  try { Promise.resolve(command.execute(bot, username, parts)).catch(error => console.error(`[COMMAND] ${name}`, error)); }
  catch (error) { console.error(`[COMMAND] ${name}`, error); }
}
module.exports = { handleIngameCommand, ALLOWED_PLAYERS, commands };
