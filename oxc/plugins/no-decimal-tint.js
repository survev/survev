/**
 * @import { ESLint, Rule } from 'eslint'
 */
const colorProps = [
    "tint",
    "color",
    "water",
    "waterRipple",
    "beach",
    "riverbank",
    "grass",
    "underground",
    "playerSubmerge",
    "playerGhillie",
    "flareColor",
    "backpackTint",
    "handTint",
    "footTint",
    "baseTint",
];

/** @type {Rule.RuleModule} */
const rule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "should be in hex not decimal",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            useHex: "should be in hex not decimal - leia-uwu (e.g. 0x{{hex}} instead of {{decimal}}).",
        },
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            before() {
                const filename = context.filename;

                if (!filename.endsWith(".ts") && !filename.endsWith(".js")) {
                    return false;
                }
            },
            Property(node) {
                /** @param {import('estree').Property} node */
                if (node.key.type !== "Identifier") {
                    return;
                }

                if (
                    node.value.type !== "Literal" ||
                    typeof node.value.value !== "number"
                ) {
                    return;
                }

                if (!colorProps.includes(node.key.name)) {
                    return;
                }

                const { value } = node.value;

                if (!Number.isInteger(value) || value <= 0) {
                    return;
                }

                const rawText = sourceCode.getText(node.value);
                if (/^0x/i.test(rawText)) {
                    return;
                }

                const hex = value.toString(16).toUpperCase();
                context.report({
                    node: node.value,
                    messageId: "useHex",
                    data: { hex, decimal: value },
                    fix(fixer) {
                        return fixer.replaceText(node.value, `0x${hex}`);
                    },
                });
            },
        };
    },
};

/** @type {ESLint.Plugin} */
const plugin = {
    meta: {
        name: "survev",
    },
    rules: {
        "no-decimal-tint": rule,
    },
};

export default plugin;
