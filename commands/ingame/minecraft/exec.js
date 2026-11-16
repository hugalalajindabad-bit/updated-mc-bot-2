
const { Vec3 } = require('vec3');

const activeBots = new WeakSet();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function move(bot, direction, blocks) {
    return new Promise((resolve, reject) => {
        const start = bot.entity.position.clone();
        const timeout = Math.max(5000, blocks * 5000);
        const started = Date.now();

        bot.setControlState(direction, true);

        const interval = setInterval(() => {
            if (!bot.entity) {
                clearInterval(interval);
                bot.setControlState(direction, false);
                return reject(new Error('Bot entity unavailable'));
            }

            const pos = bot.entity.position;
            const dx = pos.x - start.x;
            const dz = pos.z - start.z;

            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance >= blocks) {
                clearInterval(interval);
                bot.setControlState(direction, false);
                return resolve();
            }

            if (Date.now() - started > timeout) {
                clearInterval(interval);
                bot.setControlState(direction, false);
                return reject(new Error('Movement timed out'));
            }
        }, 50);
    });
}

module.exports = {
    name: 'exec',
    description: 'Execute multiple bot movements',
    allowList: true,

    async execute(bot, player, args) {
        if (activeBots.has(bot)) {
            bot.chat('Another exec command is already running!');
            return;
        }

        const input = args.join(' ').trim();

        if (!input) {
            bot.chat('Usage: ?exec help');
            return;
        }

        if (input.toLowerCase() === 'help') {
            bot.chat('Exec Commands: FD:<blocks> = Forward | BK:<blocks> = Backward');
            bot.chat('RT:<degrees> = Turn Right | LT:<degrees> = Turn Left');
            bot.chat('JUMP = Jump | SNEAK = Sneak ON | STAND = Sneak OFF');
            bot.chat('Example: ?exec FD:10 RT:90 BK:5 JUMP SNEAK LT:180');
            return;
        }

        const commands = input.toUpperCase().split(/\s+/);

        // Validate all commands before executing
        for (const cmd of commands) {
            if (/^(FD|BK):\d+(\.\d+)?$/.test(cmd)) continue;
            if (/^(RT|LT):\d+(\.\d+)?$/.test(cmd)) continue;
            if (['JUMP', 'SNEAK', 'STAND'].includes(cmd)) continue;

            bot.chat(`Invalid command: ${cmd}`);
            bot.chat('Use ?exec help for available commands.');
            return;
        }

        activeBots.add(bot);

        try {
            for (const cmd of commands) {

                if (cmd.startsWith('FD:')) {
                    const blocks = Number(cmd.slice(3));
                    bot.chat(`Moving forward ${blocks} blocks...`);
                    await move(bot, 'forward', blocks);
                }

                else if (cmd.startsWith('BK:')) {
                    const blocks = Number(cmd.slice(3));
                    bot.chat(`Moving backward ${blocks} blocks...`);
                    await move(bot, 'back', blocks);
                }

                else if (cmd.startsWith('RT:')) {
                    const degrees = Number(cmd.slice(3));
                    const yaw = bot.entity.yaw + degrees * Math.PI / 180;

                    await bot.look(yaw, bot.entity.pitch, true);
                }

                else if (cmd.startsWith('LT:')) {
                    const degrees = Number(cmd.slice(3));
                    const yaw = bot.entity.yaw - degrees * Math.PI / 180;

                    await bot.look(yaw, bot.entity.pitch, true);
                }

                else if (cmd === 'JUMP') {
                    bot.setControlState('jump', true);
                    await sleep(150);
                    bot.setControlState('jump', false);
                }

                else if (cmd === 'SNEAK') {
                    bot.setControlState('sneak', true);
                }

                else if (cmd === 'STAND') {
                    bot.setControlState('sneak', false);
                }
            }

            bot.chat('All exec commands completed!');

        } catch (error) {
            bot.chat(`Exec error: ${error.message}`);

        } finally {
            bot.setControlState('forward', false);
            bot.setControlState('back', false);
            bot.setControlState('jump', false);

            activeBots.delete(bot);
        }
    }
};
