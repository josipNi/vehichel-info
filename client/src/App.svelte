<script lang="typescript">
  import Cars from "./Cars.svelte";
  import Header from "./Header.svelte";
  import { user } from "./User";
</script>

<main>
  <Header />
  {#if $user}
    <Cars />
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
