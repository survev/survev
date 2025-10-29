export async function sendWebhook({
    messages,
    from,
    region,
    url,
}: {
    messages: unknown[];
    from: "server" | "client";
    region: string;
    url?: string;
}) {
    if (!url) return;

    try {
        const msg = messages
            .map((msg) => {
                if (msg instanceof Error) {
                    return `\`\`\`${msg.cause}\n${msg.stack}\`\`\``;
                }
                if (typeof msg == "object") {
                    return `\`\`\`json\n${JSON.stringify(msg, null, 2).replaceAll("`", "\\`")}\`\`\``;
                }
                return `${msg}`;
            })
            .join("\n");

        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                embeds: [
                    {
                        color: 0xff0000,
                        title: `${from} error`,
                        timestamp: new Date().toISOString(),
                        description: msg,
                        footer: {
                            text: `Region: ${region}`,
                        },
                    },
                ],
            }),
        });
    } catch (err) {
        // dont use defaultLogger.error here to not log it recursively :)
        console.error("Failed to log error to webhook", err);
    }
}
