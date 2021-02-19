declare module 'rethinkdb' {
    export function epochTime(time: number): Expression<Time>;
    export function literal<T>(value?: T): Expression<T>;

    interface WriteResult {
        changes?: WriteChange[];
    }

    interface WriteChange {
        new_val?: any;
        old_val?: any;
    }

    interface Sequence {
        changes(opts?: Partial<ChangesOptions>): Sequence
    }
    interface Expression<T> {
        append<E>(prop: E): Expression<E[]>;
    }

    interface Row extends Expression<any> {
        <T>(name: string): Expression<T>;
    }
}