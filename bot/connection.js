const mineflayer = require('mineflayer');
const EventEmitter = require('events');
const { registerBotEvents } = require('./events');
const { handleIngameCommand } = require('../commands/ingame/handler');

function createBotManager() {
  const events = new EventEmitter();
  let bot = null;
  let reconnectTimer = null;
  let reconnectDelay = Number(process.env.RECONNECT_DELAY_MS) || 10000;
  let stopping = false;
  let generation = 0;

  function create() {
    if (stopping || bot) return;
    const currentGeneration = ++generation;
    const options = {
      host: process.env.MC_HOST || 'mazdoor-union-0-8f1edd.play.shulkerboxes.com',
      port: Number(process.env.MC_PORT) || 25565,
      username: process.env.MC_USERNAME || 'bowt_0',
      auth: process.env.MC_AUTH || 'offline'
    };
    if (process.env.MC_VERSION) options.version = process.env.MC_VERSION;
    if (!options.host) {
      console.error('[CONFIG] MC_HOST is missing. Bot connection not started.');
      return;
    }

    console.log(`[BOT] Connecting to ${options.host}:${options.port}...`);
    const instance = mineflayer.createBot(options);
    bot = instance;
    registerBotEvents(instance, {
      onSpawn: () => {
        if (generation !== currentGeneration) return;
        reconnectDelay = Number(process.env.RECONNECT_DELAY_MS) || 10000;
        events.emit('spawn', instance);
      },
      onEnd: (reason) => {
        if (generation !== currentGeneration) return;
        bot = null;
        events.emit('end', reason);
        scheduleReconnect();
      }
    });

    instance.on('message', message => events.emit('message', message?.toString?.() || String(message)));
    instance.on('chat', (username, message) => {
      if (username === instance.username) return;
      handleIngameCommand(instance, username, message);
    });
    instance.on('error', error => console.error('[BOT ERROR]', error.code || '', error.message));
    instance.on('kicked', reason => console.warn('[BOT KICKED]', stringifyReason(reason)));
  }

  function scheduleReconnect() {
    if (stopping || String(process.env.AUTO_RECONNECT).toLowerCase() === 'false' || reconnectTimer) return;
    const delay = reconnectDelay;
    const max = Number(process.env.MAX_RECONNECT_DELAY_MS) || 60000;
    reconnectDelay = Math.min(Math.round(reconnectDelay * 1.5), max);
    console.log(`[BOT] Reconnecting in ${Math.round(delay / 1000)}s...`);
    reconnectTimer = setTimeout(() => { reconnectTimer = null; create(); }, delay);
  }

  function start() { stopping = false; if (reconnectTimer) clearTimeout(reconnectTimer); reconnectTimer = null; create(); }
  function join() { stopping = false; if (bot) return { success: true, message: 'Bot is already connected or connecting.' }; if (reconnectTimer) clearTimeout(reconnectTimer); reconnectTimer = null; create(); return { success: true, message: 'Join attempt started.' }; }
  function leave(reason = 'Dashboard leave command') {
    stopping = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    if (bot) { const current = bot; bot = null; current.quit(reason); }
    return { success: true, message: 'Bot leave requested.' };
  }
  function sendChat(message) {
    if (!bot?.player) return { success: false, message: 'Bot is not connected.' };
    bot.chat(message);
    return { success: true, message: 'Message sent.' };
  }
  function getBot() { return bot; }
  function getState() { return { online: Boolean(bot?.player && bot?.entity), connecting: Boolean(bot && !bot.player), username: process.env.MC_USERNAME || 'Unknown' }; }

  return { on: events.on.bind(events), start, join, leave, sendChat, getBot, getState };
}
function stringifyReason(reason) { try { return typeof reason === 'string' ? reason : JSON.stringify(reason); } catch { return String(reason); } }
module.exports = { createBotManager };
