import path from 'path';
import { promises as fs } from 'fs';
import { EventEmitter } from 'eventemitter3';
import { MultiKeyMap } from '../structures/MultiKeyMap';
import reloadFactory from 'require-reload';
import { guard } from '../newbu';

const reload = reloadFactory(require);

export type ModuleLogger = {
    error(...args: any[]): void;
    module(...args: any[]): void;
}
export type ModuleResult<TModule> = { names: Iterable<string>, module: TModule };

export abstract class BaseModuleLoader<TModule> extends EventEmitter {
    #root: string;
    #modules: MultiKeyMap<string, TModule>;

    constructor(
        public readonly source: string,
        public readonly logger: CatLogger
    ) {
        super();
        this.#root = getAbsolutePath(source);
        this.#modules = new MultiKeyMap<string, TModule>();

        this.#modules.on('add', (...args: any[]) => this.emit('add', ...args));
        this.#modules.on('remove', (...args: any[]) => this.emit('remove', ...args));
        this.#modules.on('link', (...args: any[]) => this.emit('link', ...args));
        this.#modules.on('unlink', (...args: any[]) => this.emit('unlink', ...args));
    }

    list() {
        return this.#modules.values();
    }

    get(name: string) {
        return this.#modules.get(name);
    }

    async init() {
        let fileNames = await fs.readdir(this.#root);
        fileNames = fileNames.filter(fileName => /\.js$/.test(fileName));
        await this.load(fileNames);
    }

    private async load(fileNames: Iterable<string>, loader = require) {
        for (let fileName of fileNames) {
            try {
                let rawModule = loader(path.join(this.#root, fileName));
                let modules = await this.activate(fileName, rawModule);
                for (let { names, module } of modules)
                    for (let name of names)
                        this.#modules.set(name, module);
            } catch (err) {
                if (err instanceof Error)
                    this.logger.error(err.stack!);
                this.logger.module(this.source, 'Error while loading module', fileName);
            }
        }
    }


    async reload(fileNames: Iterable<string>) {
        return await this.load(fileNames, reload);
    }

    protected activate(fileName: string, rawModule: any) {
        let result: Array<ModuleResult<TModule> | null> = [];
        if (typeof rawModule === 'object' || typeof rawModule === 'function') {
            result = [this.tryActivate(rawModule)];
            if (result[0] === undefined) {
                result = Object.values(rawModule)
                    .map(m => this.tryActivate(m));
            }
        }

        if (result.length === 0)
            this.logger.debug(`No modules found in ${fileName}`);

        return result.filter(guard.hasValue);
    }

    protected abstract tryActivate(rawModule: any): ModuleResult<TModule> | null;
}

function getAbsolutePath(...segments: string[]) {
    let result = path.join(...segments);
    if (path.isAbsolute(result))
        return result;
    return path.join(__dirname, '..', result);
}