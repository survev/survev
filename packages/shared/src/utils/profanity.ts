import { Constants } from "@survev/lib/net";
import {
    DataSet,
    englishDataset,
    englishRecommendedTransformers,
    pattern,
    RegExpMatcher,
} from "obscenity";

const badWordsdataSet = new DataSet<{ originalWord: string }>()
    .addAll(englishDataset)
    .removePhrasesIf((phrase) => {
        // if you really think "shit" is a bad word worth censoring i cant take you seriously
        return phrase.metadata?.originalWord === "shit";
    })
    .addPhrase((phrase) =>
        // https://github.com/jo3-l/obscenity/blob/9564653e9f8563e178cd0790ccf256dc2b610494/src/preset/english.ts#L269 only matches it without the "a"??
        phrase
            .setMetadata({ originalWord: "faggot" })
            .addPattern(pattern`faggot`),
    )
    .addPhrase((phrase) =>
        phrase
            .setMetadata({ originalWord: "hitler" })
            .addPattern(pattern`hitler`)
            .addPattern(pattern`hitla`)
            .addPattern(pattern`hit.ler`)
            .addPattern(pattern`hitlr`),
    )
    .addPhrase((phrase) =>
        phrase
            .setMetadata({ originalWord: "kill yourself" })
            .addPattern(pattern`|kys|`)
            .addPattern(pattern`kill yourself`)
            .addPattern(pattern`hang yourself`)
            .addPattern(pattern`unalive yourself`),
    )
    .addPhrase((phrase) =>
        phrase
            .setMetadata({ originalWord: "nigger" })
            .addPattern(pattern`nlgger`)
            .addPattern(pattern`n1gga`)
            .addPattern(pattern`nigg`)
            .addPattern(pattern`nlgg`)
            .addPattern(pattern`nl99er`)
            .addPattern(pattern`nl99a`)
            .addPattern(pattern`niggr`)
            .addPattern(pattern`n1ggr`)
            .addPattern(pattern`n199r`)
            .addPattern(pattern`nl99r`)
            .addPattern(pattern`nlggr`)
            .addPattern(pattern`n199er`)
            .addPattern(pattern`ni55a`)
            .addPattern(pattern`ni55er`)
            .addPattern(pattern`chigger`)
            .addPattern(pattern`chigga`)
            .addPattern(pattern`n199a`),
    )
    .addPhrase((phrase) =>
        phrase.setMetadata({ originalWord: "dick" }).addPattern(pattern`dlck`),
    );

const matcher = new RegExpMatcher({
    ...badWordsdataSet.build(),
    ...englishRecommendedTransformers,
});

export function checkForBadWords(name: string) {
    return matcher.hasMatch(name);
}

const allowedCharsRegex =
    /[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g;

export function validateUserName(name: string): {
    originalWasInvalid: boolean;
    validName: string;
} {
    const defaultName = "Player";

    if (!name || typeof name !== "string")
        return {
            originalWasInvalid: true,
            validName: defaultName,
        };

    name = name
        .trim()
        .substring(0, Constants.PlayerNameMaxLen)
        // remove extended ascii etc
        .replace(allowedCharsRegex, "")
        .trim();

    if (!name.length || checkForBadWords(name))
        return {
            originalWasInvalid: true,
            validName: defaultName,
        };

    return {
        originalWasInvalid: false,
        validName: name,
    };
}
