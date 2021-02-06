import { BaseImageGenerator } from '../structures/BaseImageGenerator'
import { randInt } from '../newbu';
import { JimpGifEncoder } from '../structures/JimpGifEncoder';
import Jimp from 'jimp';

export class FreeGenerator extends BaseImageGenerator {
    constructor(logger: WorkerLogger) {
        super(logger);
    }

    async execute({ top, bottom }: JObject) {
        if (typeof top !== 'string' || typeof bottom !== 'string')
            return;

        let topCaption = await this.renderJimpText(top, {
            font: 'impact.ttf',
            fill: 'white',
            stroke: 'black',
            strokewidth: '5',
            gravity: 'north',
            size: '380x100'
        });
        let bottomText = bottom || 'CLICK HERE TO\nFIND OUT HOW';
        let bottomCaption = await this.renderJimpText(bottomText, {
            font: 'arial.ttf',
            fill: 'white',
            gravity: 'center',
            size: '380x70'
        });

        let back1 = await this.getLocalJimp('freefreefree0.png');
        let back2 = await this.getLocalJimp('freefreefree1.png');

        let frameCount = 6;
        let base = new Jimp(400, 300);
        let gif = new JimpGifEncoder({ width: 400, height: 300, delay: 50 });
        for (let i = 0; i < frameCount; i++) {
            let frame = base.clone();
            frame.composite(i < frameCount / 2 ? back1 : back2, 0, 0);
            frame.composite(topCaption, i == 0 ? 10 : randInt(-25, 25), i == 0 ? 15 : randInt(0, 20));
            frame.composite(bottomCaption, 10, 228);
            gif.addFrame(frame);
        }
        return await gif.render();
    }

};
