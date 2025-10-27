import { z } from "zod";
import type { UsersTableSelect } from "../../api/src/db/schema";
import { Constants } from "../../shared/net/net";
import { type Item, ItemStatus, type Loadout, loadoutSchema } from "../utils/loadout";

export type ProfileResponse =
    | {
          readonly banned: true;
          reason: string;
      }
    | {
          readonly success: true;
          profile: Pick<
              UsersTableSelect,
              "slug" | "username" | "usernameSet" | "linked"
          > & {
              usernameChangeTime: number;
          };
          loadout: Loadout;
          items: Item[];
      };

export const zUsernameRequest = z.object({
    username: z.string().trim().min(1).max(Constants.PlayerNameMaxLen),
});
export type UsernameRequest = z.infer<typeof zUsernameRequest>;
export type UsernameResponse =
    | {
          result: "success";
      }
    | {
          result: "failed" | "invalid" | "taken" | "change_time_not_expired";
      };

export const zLoadoutRequest = z.object({ loadout: loadoutSchema });

export type LoadoutRequest = z.infer<typeof zLoadoutRequest>;
export type LoadoutResponse = {
    loadout: Loadout;
};

export const zSetItemStatusRequest = z.object({
    status: z.nativeEnum(ItemStatus),
    itemTypes: z.array(z.string()).max(50),
});

export type SetItemStatusRequest = z.infer<typeof zSetItemStatusRequest>;
export type SetItemStatusResponse = {};

//
// PASS
//

export const zSetQuestRequest = z.object({
    questType: z.string(),
    idx: z.number(),
});
export type SetQuestRequest = z.infer<typeof zSetQuestRequest>;
export type SetQuestResponse = {};

export const zSetPassUnlockRequest = z.object({
    unlockType: z.string(),
});
export type SetPassUnlockRequest = z.infer<typeof zSetPassUnlockRequest>;
export type SetPassUnlockResponse = { success: boolean };

export const zGetPassRequest = z.object({
    tryRefreshQuests: z.boolean(),
});
export type GetPassRequest = z.infer<typeof zGetPassRequest>;
export type GetPassResponse = { success: boolean };

export const zRefreshQuestRequest = z.object({
    idx: z.number(),
});
export type RefreshQuestRequest = z.infer<typeof zRefreshQuestRequest>;
export type RefreshQuestResponse = { success: boolean };
