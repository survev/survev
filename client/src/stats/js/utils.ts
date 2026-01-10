import { Localization } from "../../ui/localization";
import EnJs from "../en.json";

export type AcceptedLocales = "en" | "es";
export const acceptedLanguages: AcceptedLocales[] = ["en", "es"];
export const statsLocalization = new Localization(
    "en",
    acceptedLanguages,
    {
        en: EnJs as unknown as Record<string, string>,
    },
    true,
);

// leaving this for reference
// //
// // Ads
// //
// class Ads {
//     slotIdToPlacement = {
//         survevio_728x90_leaderboard_top: "survevio_728x90_leaderboard",
//         survevio_300x250_leaderboard_top: "survevio_300x250_leaderboard",
//         survevio_300x250_leaderboard_bottom: "survevio_300x250_leaderboard",
//         survevio_728x90_playerprofile_top: "survevio_728x90_playerprofile",
//         survevio_300x250_playerprofile_top: "survevio_300x250_playerprofile",
//         survevio_300x250_playerprofile_bottom: "survevio_300x250_playerprofile",
//     };
//     showFreestarAds(_slotIds: string) {}
//     getFreestarSlotPlacement(_slotId: string) {}
// }
// export class App {
//     setView(name?: string) {
//         /*
//         const phoneDetected = device.mobile && !device.tablet;
//         const elAdsLeaderboardTop = $("#adsLeaderBoardTop");
//         const elAdsLeaderboardBottom = $("#adsLeaderBoardBottom");
//         const elAdsPlayerTop = $("#adsPlayerTop");
//         const elAdsPlayerBottom = $("#adsPlayerBottom");
//         */

//         if (name == "player") {
//             /*
//             elAdsLeaderboardTop.css("display", "none");
//             elAdsLeaderboardBottom.css("display", "none");
//             if (phoneDetected) {
//                 elAdsPlayerTop.css("display", "none");
//                 elAdsPlayerBottom.css("display", "block");
//             } else {
//                 elAdsPlayerTop.css("display", "block");
//                 elAdsPlayerBottom.css("display", "none");
//             }
//             */
//         } else {
//             /*
//             elAdsPlayerTop.css("display", "none");
//             elAdsPlayerBottom.css("display", "none");

//             if (phoneDetected) {
//                 elAdsLeaderboardTop.css("display", "none");
//                 elAdsLeaderboardBottom.css("display", "block");
//             } else {
//                 elAdsLeaderboardTop.css("display", "block");
//                 elAdsLeaderboardBottom.css("display", "none");
//             }
//             */
//             // this.view = this.mainView;
//         }

//         /*
//         // show ads
//         const slotIds = [];
//         if (elAdsLeaderboardTop && elAdsLeaderboardTop.css("display") != "none") {
//             slotIds.push("survevio_728x90_leaderboard_top");
//             slotIds.push("survevio_300x250_leaderboard_top");
//         }
//         if (elAdsLeaderboardBottom && elAdsLeaderboardBottom.css("display") != "none") {
//             slotIds.push("survevio_300x250_leaderboard_bottom");
//         }
//         if (elAdsPlayerTop && elAdsPlayerTop.css("display") != "none") {
//             slotIds.push("survevio_728x90_playerprofile_top");
//             slotIds.push("survevio_300x250_playerprofile_top");
//         }
//         if (elAdsPlayerBottom && elAdsPlayerBottom.css("display") != "none") {
//             slotIds.push("survevio_300x250_playerprofile_bottom");
//         }
//         this.adManager.showFreestarAds(slotIds);
//         */
//     }
// }
