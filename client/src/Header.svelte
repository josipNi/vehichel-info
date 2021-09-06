<script lang="typescript">
  import Login from "./Login.svelte";
  import { user } from "./User";

  function signout() {
    user.set(null);
    localStorage.clear();
  }
</script>

<header>
  <h1>🚛</h1>
  {#if $user}
    <div class="user-bio">
      <span>Hello <strong>{$user.username}</strong></span>
    </div>

    <button class="signout-button" on:click={signout}>Sign Out</button>
  {:else}
    <Login />
  {/if}
</header>

<style>
  .signout-button {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
</style>
