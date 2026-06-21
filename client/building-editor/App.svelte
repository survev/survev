<script lang="ts">
    import "$lib/css/editor.css";

    import.meta.hot?.accept(() => {
        import.meta.hot?.invalidate();
    });
</script>

<div id="editor-ui"></div>
<!-- svelte-ignore a11y_positive_tabindex -->
<canvas id="cvs" tabindex="1"></canvas>
<div id="game-touch-area"></div>
