import { and, count, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { MapId, TeamModeToString } from "../../../../../shared/defs/types/misc";
import { Config } from "../../../config";
import { server } from "../../apiServer";
import { databaseEnabledMiddleware, validateParams } from "../../auth/middleware";
import { db } from "../../db";
import { ipLogsTable, reportsTable, usersTable } from "../../db/schema";

export const ReportsRouter = new Hono()
    .use(databaseEnabledMiddleware)
    .post(
        "/mark_as_reviewed",
        validateParams(z.object({ reportId: z.string() })),
        async (c) => {
            const { reportId } = c.req.valid("json");

            await db
                .update(reportsTable)
                .set({
                    status: "reviewed",
                })
                .where(eq(reportsTable.id, reportId));

            return c.json({ message: "Report marked as reviewed" }, 200);
        },
    )
    .post(
        "/ignore_report",
        validateParams(z.object({ reportId: z.string() })),
        async (c) => {
            const { reportId } = c.req.valid("json");

            const [{ reportedBy }] = await db
                .update(reportsTable)
                .set({
                    status: "ignored",
                })
                .where(eq(reportsTable.id, reportId))
                .returning({ reportedBy: reportsTable.reportedBy });

            if (!reportedBy) {
                return c.json({ message: "Report not found" }, 200);
            }

            const [{ count }] = await db
                .select({
                    count: sql<number>`sum(case when ${reportsTable.status} = 'ignored' then 1 else 0 end)`,
                })
                .from(reportsTable)
                .where(eq(reportsTable.reportedBy, reportedBy))
                .limit(1);

            const MAX_IGNORED_REPORTS = 3;
            if (count <= MAX_IGNORED_REPORTS)
                return c.json({ message: `Ignored report with id: ${reportId}` }, 200);

            await db
                .update(usersTable)
                .set({ canReportPlayers: false })
                .where(eq(usersTable.id, reportedBy));

            return c.json(
                { message: `User would no longer be able to make reports` },
                200,
            );
        },
    )
    .post(
        "/save_game_recording",
        validateParams(
            z.object({
                gameId: z.string(),
                reportedBy: z.string(),
                recording: z.string(),
                sepectatedPlayerNames: z.array(z.string()),
            }),
        ),
        async (c) => {
            const { gameId, recording, reportedBy, sepectatedPlayerNames } =
                c.req.valid("json");

            const user = await db.query.usersTable.findFirst({
                where: eq(usersTable.id, reportedBy),
                columns: {
                    canReportPlayers: true,
                },
            });

            // TODO: ideally we should check for this before making the request
            if (!user?.canReportPlayers) {
                return c.json({ message: "You can't report players" }, 200);
            }

            // insert the report and get the id
            const [{ id: reportId }] = await db
                .insert(reportsTable)
                .values({
                    gameId,
                    recording,
                    reportedBy: reportedBy,
                    sepectatedPlayerNames,
                })
                .returning({
                    id: reportsTable.id,
                });

            if (!Config.recordingReportWebhook)
                return c.json({ message: "report saved" }, 200);

            const result = await db
                .select({
                    slug: usersTable.slug,
                    reportedAt: reportsTable.createdAt,
                    reportsTotal: count(reportsTable.id),
                    reportsIgnored: sql<number>`sum(case when ${reportsTable.status} = 'ignored' then 1 else 0 end)`,
                    reportsReviewed: sql<number>`sum(case when ${reportsTable.status} = 'reviewed' then 1 else 0 end)`,
                })
                .from(usersTable)
                .where(eq(usersTable.id, reportedBy))
                .innerJoin(reportsTable, eq(usersTable.id, reportsTable.reportedBy))
                .groupBy(usersTable.slug, reportsTable.createdAt)
                .limit(1);

            if (!result) {
                return c.json({ message: "Failed to fetch report data" }, 200);
            }

            const [info] = result;

            const body = {
                embeds: [
                    {
                        title: "📸 Click me for to review the report",
                        description: "lil bro got caught in 4k",
                        color: 5814783,
                        url: `http://localhost:3000/?replay=/api/get_recording/${reportId}`,
                        fields: [
                            { name: "👤 Reported By", value: info.slug },
                            { name: "📈 Total Reports", value: info.reportsTotal },
                            { name: "🔍 Ignored Reports", value: info.reportsIgnored },
                            { name: "✅ Valid Reports", value: info.reportsReviewed },
                        ].map((d) => ({ ...d, inline: true })),
                        footer: {
                            text: "💃",
                        },
                        timestamp: info.reportedAt.toISOString(),
                    },
                ],
            };

            try {
                await fetch(Config.recordingReportWebhook, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                });
            } catch (error) {
                server.logger.error("Failed to send Discord webhook:", error);
            }

            return c.json({ message: "report saved" }, 200);
        },
    )
    .post(
        "get_data_by_recording_id",
        validateParams(
            z.object({
                reportId: z.string(),
            }),
        ),
        async (c) => {
            const { reportId: recordingId } = c.req.valid("json");

            const recordingData = await db.query.reportsTable.findFirst({
                where: eq(reportsTable.id, recordingId),
                columns: {
                    gameId: true,
                    sepectatedPlayerNames: true,
                },
            });

            if (!recordingData) {
                return c.json(
                    {
                        message: "No recoring found for this id",
                    },
                    200,
                );
            }

            const { gameId, sepectatedPlayerNames } = recordingData;

            if (sepectatedPlayerNames.length == 0) {
                return c.json(
                    { message: "No players to show, this shouldn't happen" },
                    200,
                );
            }

            // const MAX_PLAYERS_TO_SHOW = 15;
            // if (sepectatedPlayerNames.length > MAX_PLAYERS_TO_SHOW) {
            //     return c.json(
            //         {
            //             message: `Spectated more than ${MAX_PLAYERS_TO_SHOW} playes, they should seek help`,
            //         },
            //         200,
            //     );
            // }

            const result = await db
                .select({
                    slug: usersTable.slug,
                    authId: usersTable.authId,
                    linkedDiscord: usersTable.linkedDiscord,
                    ip: ipLogsTable.encodedIp,
                    findGameIp: ipLogsTable.findGameEncodedIp,
                    username: ipLogsTable.username,
                    region: ipLogsTable.region,
                    teamMode: ipLogsTable.teamMode,
                    createdAt: ipLogsTable.createdAt,
                    mapId: ipLogsTable.mapId,
                })
                .from(ipLogsTable)
                .where(
                    and(
                        eq(ipLogsTable.gameId, gameId),
                        inArray(ipLogsTable.username, sepectatedPlayerNames),
                    ),
                )
                .leftJoin(usersTable, eq(ipLogsTable.userId, usersTable.id))
                .orderBy(desc(ipLogsTable.createdAt));
            // .limit(MAX_PLAYERS_TO_SHOW);

            if (result.length === 0) {
                return c.json(
                    {
                        message: `No IP found for ${sepectatedPlayerNames.join(", ")}. Weird.`,
                    },
                    200,
                );
            }

            const prettyResult = result.map((data) => ({
                ...data,
                teamMode: TeamModeToString[data.teamMode],
                mapId: MapId[data.mapId],
            }));

            return c.json(prettyResult, 200);
        },
    );

export async function deleteOldReports() {
    const aWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await db
        .update(reportsTable)
        .set({ recording: "" })
        .where(lt(reportsTable.createdAt, aWeekAgo));
}
