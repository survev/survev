<script lang="ts">
    let { type }: {
        type: 'leaderboard' | 'player' | 'match_history';
    } = $props();
  </script>
  
  {#if type === 'leaderboard'}
    <div class="col-12 spinner-wrapper-leaderboard">
      <div class="spinner"></div>
    </div>
  {:else if type === 'player'}
    <div class='container'>
      <div class="col-12 spinner-wrapper-player">
        <div class="spinner"></div>
      </div>
    </div>
  {:else if type === 'match_history'}
    <div class="col-12 spinner-wrapper-match-history">
      <div class="spinner"></div>
    </div>
  {/if}