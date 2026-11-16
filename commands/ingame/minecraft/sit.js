module.exports = {
    name: 'sit',
    description: 'Makes the bot sit or stand',
    allowList: true,

    execute(bot, player, args) {
        const action = (args[0] || 'true').toLowerCase();

        if (action === 'true') {
            bot.setControlState('sneak', true);
            bot.chat('Sitting enabled!');
        } 
        else if (action === 'false') {
            bot.setControlState('sneak', false);
            bot.chat('Sitting disabled!');
        } 
        else {
            bot.chat('Usage: !sit [true/false]');
        }
    }
};
