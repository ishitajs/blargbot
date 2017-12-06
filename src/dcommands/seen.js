var e = module.exports = {};


e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'seen <user>';
e.info = 'Tells you the last time I saw a user speak!';
e.longinfo = `<p>Tells you the last time I saw a user speak!</p>`;

e.execute = async function(msg, words) {
    if (!words[1]) {
        bu.send(msg, 'You have to tell me what user you want!');
        return;
    }
    let user = await bu.getUser(msg, words.slice(1).join(' '));
    if (user) {
        let storedUser = await r.table('user').get(user.id);
        if (!storedUser) {
            bu.send(msg, `I have never seen **${bu.getFullName(user)}** before!`);
            return;
        }
        let lastSeen = dep.moment(storedUser.lastspoke);
        console.debug(storedUser.lastspoke, lastSeen.format('llll'));
        let diff = dep.moment.duration(dep.moment() - lastSeen);
        diff = diff.subtract(diff.asMilliseconds() * 2, 'ms');
        bu.send(msg, `I last saw **${bu.getFullName(user)}** ${diff.humanize(true)}`);
    }
};