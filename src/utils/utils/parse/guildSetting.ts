import { Message } from 'eris';
import { ClusterUtilities } from '../../../cluster';
import { StoredGuildSettings } from '../../../core/database';
import { guildSettings } from '../../constants';
import { guard } from '../guard';
import { boolean } from './boolean';
import { int } from './int';

export async function guildSetting<T extends keyof StoredGuildSettings>(
    msg: Message,
    util: ClusterUtilities,
    key: T,
    raw: string
): Promise<{ success: true, value: StoredGuildSettings[T] } | { success: false }> {
    const def = guildSettings[key];
    if (!def)
        return { success: false };

    if (raw === undefined || raw.length === 0)
        return { success: true, value: undefined };

    switch (def.type) {
        case 'string': return { success: true, value: <StoredGuildSettings[T]>raw };
        case 'int': {
            const val = int(raw);
            return { success: !Number.isNaN(val), value: <StoredGuildSettings[T]>val };
        }
        case 'bool': {
            const val = boolean(raw, undefined);
            return { success: val !== undefined, value: <StoredGuildSettings[T]>val };
        }
        case 'channel': {
            const channel = await util.getChannel(msg, raw);
            return { success: channel !== null && guard.isTextableChannel(channel), value: <StoredGuildSettings[T]>channel?.id };
        }
        case 'role': {
            if (!guard.isGuildMessage(msg))
                return { success: false };
            const role = await util.getRole(msg, raw);
            return { success: role !== null, value: <StoredGuildSettings[T]>role?.id };
        }
    }
}