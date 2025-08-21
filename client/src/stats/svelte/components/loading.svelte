<script lang="ts">
    const { type }: { type: "leaderboard" | "player" | "match_history" } = $props();
</script>

<div
    class="col-12"
    class:spinner-wrapper-leaderboard={type === "leaderboard"}
    class:spinner-wrapper-player={type === "player"}
    class:spinner-wrapper-match-history={type === "match_history"}
    >
    <div class="spinner"></div>
</div>
