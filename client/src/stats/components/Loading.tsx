import type { Component } from "solid-js";

export interface LoadingProps {
    type: "leaderboard" | "player" | "match_history";
}

export const Loading: Component<LoadingProps> = (props) => {
    return (
        <>
            {props.type === "leaderboard" && (
                <div class="col-12 spinner-wrapper-leaderboard">
                    <div class="spinner"></div>
                </div>
            )}
            {props.type === "player" && (
                <div class="container">
                    <div class="col-12 spinner-wrapper-player">
                        <div class="spinner"></div>
                    </div>
                </div>
            )}
            {props.type === "match_history" && (
                <div class="col-12 spinner-wrapper-match-history">
                    <div class="spinner"></div>
                </div>
            )}
        </>
    );
};
