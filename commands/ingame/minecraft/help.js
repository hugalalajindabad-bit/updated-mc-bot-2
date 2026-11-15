module.exports = {
  name: 'help', description: 'Lists available commands', allowList: false,
  execute(bot) { bot.chat('Commands: ?help, ?ping, ?come, ?tpaccept'); }
};
