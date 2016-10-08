var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `length`;
e.args = `&lt;text&gt;`;
e.usage = `{length;text}`;
e.desc = `Gives the amount of characters in <code>text</code>.`;
e.exampleIn = `What you said is {length;{args}} chars long.`;
e.exampleOut = `What you said is 5 chars long.`;


e.execute = (params) => {
    params.args[1] = bu.processTagInner(params, 1);
    let args1 = params.args[1];
    let replaceContent = false;
    let replaceString = args1.length.toString();

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};
