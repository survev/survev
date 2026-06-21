import type { FindGamePrivateBody } from "./types.ts";

export interface ParticipantRecord {
    key: string;
    reservationId: string;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeClientId(clientId?: string): string | undefined {
    if (!clientId || !uuidRegex.test(clientId)) return undefined;
    return clientId.toLowerCase();
}

export function normalizeIp(ip: string): string {
    return ip.toLowerCase();
}

export function getParticipantKeys(
    player: Pick<FindGamePrivateBody["playerData"][number], "userId" | "clientId" | "ip">,
): string[] {
    const keys = [`ip:${normalizeIp(player.ip)}`];
    const clientId = normalizeClientId(player.clientId);
    if (player.userId) keys.push(`user:${player.userId}`);
    if (clientId) keys.push(`client:${clientId}`);
    return keys;
}

export function hasParticipantConflict(
    records: Iterable<ParticipantRecord>,
    keys: Iterable<string>,
    reservationId: string,
): boolean {
    const candidateKeys = new Set(keys);
    for (const record of records) {
        if (!candidateKeys.has(record.key)) continue;
        if (record.key.startsWith("ip:") && record.reservationId === reservationId) {
            continue;
        }
        return true;
    }
    return false;
}
