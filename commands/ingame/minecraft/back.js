module.exports = {
  name: 'back', description: 'BACK', allowList: true,
  execute(bot, username) {
    const template = '/back';
    bot.chat(template);
  }
};
