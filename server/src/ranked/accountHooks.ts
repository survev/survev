import { HTTPException } from "hono/http-exception";
import type { UserAccountHooks } from "../api/routes/user/UserRouter.ts";
import type { RankedCoordinator } from "./coordinator.ts";
import type { RankedStore } from "./store.ts";

export function createRankedAccountHooks(store: RankedStore, coordinator: RankedCoordinator): UserAccountHooks {
    const requireIdle = (id: string) => {
        if (!store.getProfile(id)) return;
        const state = coordinator.state(id);
        if (state.queue || state.match || (state.series && !state.series.result)) {
            const message = "Leave the ranked queue or finish your match first.";
            throw new HTTPException(409, { message, res: Response.json({ error: message }, { status: 409 }) });
        }
    };
    return {
        beforeLogout: id => {
            requireIdle(id);
            coordinator.acknowledge(id);
            coordinator.leaveParty(id);
        },
        beforeRename: requireIdle,
        afterRename: (id, name) => {
            if (store.getProfile(id)) store.linkAccount(id, name);
        },
        beforeDelete: id => store.markNativeDeletion(id),
        onDelete: id => store.completeNativeDeletion(id),
    };
}
