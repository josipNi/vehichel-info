<script lang="typescript">
  import { user } from "./User";
  import { onMount } from "svelte";

  let username;
  let password;

  function fromTokenToUser(token: string) {
    const jsonString = atob(token.split(".")[1]);
    const user = JSON.parse(jsonString);
    user.headers = {
      authorization: token,
    };
    return user;
  }
  async function login() {
    const res = await fetch(`http://localhost:4001/login`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const error = await res.text();
      alert(error);
    } else {
      const { token } = await res.json();
      localStorage.setItem("token", token);
      user.set(fromTokenToUser(token));
    }
  }
  async function signup() {
    const res = await fetch(`http://localhost:4001/signup`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const error = await res.text();
      alert(error);
    }
  }
  onMount(() => {
    const jsonString = localStorage.getItem("token");
    if (jsonString) {
      user.set(fromTokenToUser(jsonString));
    }
  });
</script>

<div>
  <div>
    <label for="username">Username</label>
    <input
      name="username"
      bind:value={username}
      minlength="3"
      maxlength="16"
      required
    />
  </div>
  <div>
    <label for="password">Password</label>
    <input name="password" bind:value={password} type="password" required />
  </div>
  <button class="login" on:click={login}>Login</button>
  <button class="login" on:click={signup}>Sign Up</button>
</div>
