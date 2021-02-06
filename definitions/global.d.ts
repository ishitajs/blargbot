import configJson from '../config.json';
import CatLoggr from 'cat-loggr/ts';
import { Snowflake as _Snowflake } from 'catflake';

declare global {

    export type JToken = JObject | JArray | JValue | null | undefined;
    export type JValue = string | number | boolean;
    export type JObject = { [key: string]: JToken };
    export type JArray = Array<JToken>;

    export type Configuration = typeof configJson;
    export type CatLogger = CatLoggr;
    export type Snowflake = _Snowflake;

    export type ClassOf<T> = Function & { prototype: T };

    namespace NodeJS {
        type WorkerProcess = Process & Required<Pick<Process, 'send'>>;

        interface Process {
            kill(): true;
        }
    }
}
