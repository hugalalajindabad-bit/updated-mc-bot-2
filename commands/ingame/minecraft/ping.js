module.exports = {
    name: 'ping',
    description: 'Shows bot latency',
    allowList: false,

    execute(bot) {
        const ping = bot.player.ping;
        bot.chat(` Pong! My ping is ${ping} ms`);
    }
};
