/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 interesting12345
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { classes } from "@utils/misc";
import definePlugin, { IconProps, OptionType } from "@utils/types";
import { MessageStore } from "@webpack/common";
import type { PropsWithChildren } from "react";

const settings = definePluginSettings({

    targetChannel: {
        type: OptionType.STRING,
        description: "Channel ID(s) to target, separated by a comma (\",\")"
    },
    searchSettings: {
        type: OptionType.SELECT,
        description: "Enables backwards search to compare messages to the most recent one rather than the preceding one",
        options: [
            {
                label: "Search From Baseline",
                value: "baseline-search",
                default: true
            },
            {
                label: "Backwards Search",
                value: "backwards-search",
            },
            {
                label: "Compare With Last Message",
                value: "compare"
            }
        ]
    },
    exemptionValue: {
        type: OptionType.SELECT,
        description: "Determines what exempting a message sets it to",
        options: [
            {
                label: "Previous Correct",
                value: "prev-correct",
                default: true
            },
            {
                label: "Next Valid Number",
                value: "next-num"
            },
            {
                label: "Imminently Previous Valid Number",
                value: "prev-num"
            }
        ]
    },
    countByValue: {
        type: OptionType.NUMBER,
        description: "Increment to count by",
        default: 1
    }
});

const allowedMessages = new Map();

export default definePlugin({

    name: "CountingPlugin",
    description: "This plugin counts (no it doesn't)",
    authors: [
        {
            name: "interesting12345",
            id: 12345n
        }
    ],
    settings,

    start() {

        console.log("[CountPlugin] Plugin Started!");

    },

    stop() {

        console.log("[CountPlugin] Plugin Stopped!");

    },

    renderMessageAccessory(props) {

        if (!isTargetChannel(Vencord.Webpack.Common.SelectedChannelStore.getChannelId())) return null;

        let result: string;

        if (settings.store.searchSettings !== "baseline-search") {
            result = getStatus(props.message.id);
        } else {
            result = backwardsGetStatus(props.message.id);
        }

        if (result === "uncertain") {
            return (
                <div
                    style={{
                        marginTop: "6px",
                        padding: "6px 10px",
                        borderRadius: "5px",
                        backgroundColor: "rgba(255, 170, 0, 0.15)",
                        borderLeft: "3px solid #ffaa00",
                        color: "#ffaa00",
                        fontSize: "12px",
                        width: "150px",
                    }}
                >
                    REVIEW
                </div>
            );
        }
        else if (result === "correct") {
            if (allowedMessages.get(props.message.id)) {
                return (
                    <p
                        style={{
                            marginTop: "6px",
                            padding: "6px 10px",
                            color: "#66ff00",
                            fontSize: "12px",
                            width: "100px",
                        }}
                    >
                        &#91;EXEMPT&#93;
                    </p>
                );
            }
            return (
                <p
                    style={{
                        marginTop: "6px",
                        padding: "6px 10px",
                        color: "#08ff00",
                        fontSize: "12px",
                        width: "100px",
                    }}
                >
                    &#91;CORRECT&#93;
                </p>
            );
        } else if (result === "incorrect") {
            return (
                <div
                    style={{
                        marginTop: "6px",
                        padding: "6px 10px",
                        borderRadius: "5px",
                        backgroundColor: "rgb(194 0 0 / 0.45)",
                        borderLeft: "3px solid #ffaa00",
                        color: "#ff0000",
                        fontSize: "12px",
                        width: "150px",
                    }}
                >
                    Something went wrong here...
                </div>
            );
        } else {
            return (<p>Error...</p>);
        }

    },

    messagePopoverButton: {
        icon: CheckmarkIcon,
        render(message) {

            if (!isTargetChannel(Vencord.Webpack.Common.SelectedChannelStore.getChannelId())) return null;

            if (!allowedMessages.get(message.id)) {

                // if the message is not in the message store (add one)
                return {

                    label: "Accept Message",
                    icon: CheckmarkIcon,
                    onClick: () => {

                        // add an entry in the messageStore
                        allowedMessages.set(message.id, getExemptMessageValue(message.id));

                    }

                };

            } else {

                // if the message is already in the message store (remove it)
                return {

                    label: "\"Unaccept\" Message",
                    icon: NotCheckmarkIcon,
                    onClick: () => {

                        // Do something when clicked
                        allowedMessages.delete(message.id);

                    }

                };

            }

        }

    }

});

function getExemptMessageValue(messageId: string): Number | null {

    // finds the last value or last correct value to exempt
    const exempt = settings.store.exemptionValue;
    const messages = getMessages();
    const index = messages.findIndex(m => m.id === messageId);

    if (exempt === "prev-correct") {

        let lastCorrect: number | null = null;

        for (let i = 0; i <= index; i++) {

            let current: null | number;

            if (allowedMessages.get(messages[i].id)) {

                current = allowedMessages.get(messages[i].id);

            } else {

                current = parseNumber(messages[i].content);

            }

            // if there are no numbers, return uncertain
            if (current === null) {
                continue;
            }

            // checks if integer is safe
            if (!Number.isSafeInteger(current)) {
                continue;
            }

            // checks if its first message in sequence (baseline)
            if (lastCorrect === null) {
                lastCorrect = current;

                if (i === index) return null;
                continue;
            }

            // update the expected number to the last correct number + 1
            const expected = lastCorrect + settings.store.countByValue;

            // compare current number to the expected one (last correct one plus one)
            if (current === expected) {

                lastCorrect = current;

            }

            if (i === index - 1) return lastCorrect + settings.store.countByValue;

        }

    } else if (exempt === "prev-num") {

        let num: number | null;

        for (let i = index - 1; i >= 0; i--) {

            if (allowedMessages.get(messages[i].id)) {

                num = allowedMessages.get(messages[i].id);

            } else {

                num = parseNumber(messages[i].content);

            }

            if (num !== null) {

                return num;

            }

        }

    } else if (exempt === "next-num") {

        for (let i = index + 1; i < messages.length; i++) {

            let num: number | null;

            if (allowedMessages.get(messages[i].id)) {

                num = allowedMessages.get(messages[i].id);

            } else {

                num = parseNumber(messages[i].content);

            }

            if (num !== null) {

                return num;

            }

        }

    }

    return null;

}

function getStatus(messageId: string): string {

    const messages = getMessages();
    const index = messages.findIndex(m => m.id === messageId);

    if (index <= 0) return "uncertain";

    let curr = messages[index];

    if (allowedMessages.get(curr.id)) {
        curr = allowedMessages.get(curr.id);
    }

    // backwards search:
    for (let i = index - 1; i >= 0; i--) {

        let prev = messages[index - 1];

        if (allowedMessages.get(prev.id)) {
            prev = allowedMessages.get(prev.id);
        }

        const result = checkMessage(prev.content, curr.content);

        if (result.status === "correct") return "correct";

        if (settings.store.searchSettings === "compare") {

            return result.status;

        }

    }

    return "uncertain";

}

function backwardsGetStatus(messageId: string): string {

    const messages = getMessages();

    const index = messages.findIndex(m => m.id === messageId);

    if (index < 0) return "uncertain";

    let lastCorrect: number | null = null;

    for (let i = 0; i <= index; i++) {

        let numbers: number | null;

        // get all numbers in the message (with regex)
        if (allowedMessages.get(messages[i].id)) {

            numbers = allowedMessages.get(messages[i].id);

        } else {

            numbers = parseNumber(messages[i].content);

        }

        // if there are no numbers, return uncertain
        if (numbers === null) {
            if (i === index) return "uncertain";
            continue;
        }

        // set current number to the first number in the message
        const current = numbers;

        // checks if integer is safe
        if (!Number.isSafeInteger(current)) {
            if (i === index) return "uncertain";
            continue;
        }

        // checks if its first message in sequence (baseline)
        if (lastCorrect === null) {
            lastCorrect = current;

            if (i === index) return "uncertain";
            continue;
        }

        // update the expected number to the last correct number + 1
        const expected = lastCorrect + settings.store.countByValue;

        // compare current number to the expected one (last correct one plus one)
        if (current === expected) {
            lastCorrect = current;

            // if it is the current message to compare
            if (i === index) return "correct";
        } else {
            // if the number was incorrect
            if (i === index) return "incorrect";
        }

    }

    return "uncertain";

}

function getMessages() {

    if (!isTargetChannel(Vencord.Webpack.Common.SelectedChannelStore.getChannelId())) return [];

    const channelMessages = MessageStore.getMessages(Vencord.Webpack.Common.SelectedChannelStore.getChannelId());
    const messages = [...channelMessages._array];

    messages.sort((a, b) =>
        (BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0)
    );

    return messages;

}

function checkMessage(first: string | null, second: string) {

    if (first === null) {
        return { status: "uncertain" };
    }

    const previous = parseNumber(first);
    const current = parseNumber(second);

    if (previous === null || current === null) {

        return { status: "uncertain" };

    }

    const expected = previous + settings.store.countByValue;

    if (!Number.isSafeInteger(previous) ||
        !Number.isSafeInteger(current)) {
        console.log("Unsafe integers");
        return { status: "uncertain" };
    }

    return {
        status: current === expected ? "correct" : "incorrect",
        expected
    };

}

function parseNumber(input: string): number | null {

    const numbers = input.match(/\d+/g) ?? [];

    if (numbers.length < 1) {
        return null;
    }

    return Number(numbers[0]);

}

function isTargetChannel(id: string): boolean {

    // get channel id with Vencord.Webpack.Common.SelectedChannelStore.getChannelId(); as needed
    const targets = settings.store.targetChannel;

    if (targets == null) return false;

    const values = targets.split(",");

    for (let i = 0; i < values.length; i++) {

        if (values[i].toString().trim() === id) return true;

    }

    return false;

}

// Borrowing icon rendering:

interface BaseIconProps extends IconProps {
    viewBox: string;
}

function Icon({ height = 24, width = 24, className, children, viewBox, ...svgProps }: PropsWithChildren<BaseIconProps>) {
    return (
        <svg
            className={classes(className, "vc-icon")}
            role="img"
            width={width}
            height={height}
            viewBox={viewBox}
            {...svgProps}
        >
            {children}
        </svg>
    );
}

export function CheckmarkIcon(props: IconProps) {

    return (
        // check mark icon
        <Icon
            {...props}
            className={classes(props.className, "counting-accept-icon")}
            viewBox="0 0 18 18"
        >
            <polygon
                fillRule="nonzero"
                fill="currentColor"
                points="15 4 7 12 3 8 1.5 9.5 7 15 16.5 5.5"
            />
        </Icon>
    );

}

export function NotCheckmarkIcon(props: IconProps) {

    return (
        // X icon
        <Icon
            {...props}
            className={classes(props.className, "counting-unaccept-icon")}
            viewBox="0 0 18 18"
        >
            <polygon
                fillRule="nonzero"
                fill="currentColor"
                points="14.5 4.9 13.1 3.5 9 7.6 4.9 3.5 3.5 4.9 7.6 9 3.5 13.1 4.9 14.5 9 10.4 13.1 14.5 14.5 13.1 10.4 9"
            />
        </Icon>
    );

}
