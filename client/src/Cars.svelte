<script lang="typescript">
  import { user } from "./User";

  let shownText = "Search to show data";
  let cars: Car[] = [];
  let searchState = {};

  async function deleteCar(id: string) {
    if (!confirm("Are you sure you want to delete")) {
      return;
    }
    const res = await fetch(`http://localhost:4001/car/${id}`, {
      method: "DELETE",
      headers: $user.headers,
    });
    if (res.ok) {
      search();
    }
  }

  function add() {
    cars.unshift({ model: "", make: "", year: "" });
    cars = [...cars];
  }

  const validators = {
    year: (x: string | number) => {
      x = +x;
      if (isNaN(x)) {
        alert("You must enter a number...");
        return true;
      }
      if (x < 1995 || x > 2022) {
        alert("year must be between 1995 and 2022");
        return true;
      }
      return false;
    },
    make: (x: string) => {
      if (!x) {
        alert("Make must be defined");
        return true;
      }
      return false;
    },
    validateAll: function (car: Car) {
      let year = this.year(car.year);
      let make = this.make(car.make);
      return year || make;
    },
  };

  async function create(car: Car) {
    if (validators.validateAll(car)) {
      return;
    }

    const res = await fetch(`http://localhost:4001/car`, {
      method: "POST",
      body: JSON.stringify(car),
      headers: {
        "Content-Type": "application/json",
        ...$user.headers,
      },
    });
    if (!res.ok) {
      const result = await res.text();
      alert(result);
    } else {
      const carIndex = cars.indexOf(car);
      cars[carIndex]._id = (await res.json())._id;
      cars = [...cars];
    }
  }

  let timeoutId;
  async function search() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      if (this) {
        const value = this.value;
        const name = this.name;
        const searchObj = {
          [name]: value,
        };
        searchState = { ...searchState, ...searchObj };
      }

      const res = await fetch(
        `http://localhost:4001/car?${new URLSearchParams(searchState)}`,
        { headers: $user.headers }
      );
      if (res.ok) {
        cars = [...(await res.json())];
        if (cars.length === 0) {
          shownText = "No data found";
        }
      } else {
        alert(await res.json());
      }
    }, 300);
  }

  async function onChange(e: any, index: number, car: Car) {
    let event = e as CustomInputEvent;
    if (event.target) {
      const value = event.target.value;
      const propertyName = event.target.id;
      const current = cars[index];
      current[propertyName] = value;
      cars = [...cars];
    }
  }

  search();
</script>

<div>
  <input
    on:input={search}
    type="text"
    class="w-100"
    name="make"
    placeholder="Search by make"
  />
  <input
    on:input={search}
    type="text"
    class="w-100"
    name="model"
    placeholder="Search by model"
  />
  <input
    on:input={search}
    type="text"
    class="w-100"
    name="year"
    placeholder="Search by year"
  />
</div>
<div class="w-100">
  <button on:click={add} class="add-button">+</button>
</div>
<main>
  {#if cars.length === 0}
    <p>{shownText}</p>
  {:else}
    <div class="w-100 overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Make</th>
            <th>Model</th>
            <th>Year</th>
          </tr>
        </thead>

        {#each cars as car, index}
          <tr>
            <td>{index}</td>

            <td>
              {#if !car._id}
                <input
                  style="margin: 1rem"
                  id="make"
                  on:input={(e) => onChange(e, index, car)}
                  type="text"
                  value={car.make}
                />
              {:else}
                {car.make}
              {/if}
            </td>

            <td>
              {#if !car._id}
                <input
                  id="model"
                  on:input={(e) => onChange(e, index, car)}
                  type="text"
                  value={car.model}
                />
              {:else}
                {car.model}
              {/if}
            </td>
            <td>
              {#if !car._id}
                <input
                  id="year"
                  on:input={(e) => onChange(e, index, car)}
                  type="number"
                  value={car.year}
                />
              {:else}
                {car.year}
              {/if}
            </td>
            <td>
              {#if car._id}
                <button
                  class="delete-button"
                  on:click={() => deleteCar(car._id)}
                >
                  🗑
                </button>
              {/if}
              {#if !car._id}
                <button class="save-button" on:click={() => create(car)}>
                  🖬
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      </table>
    </div>
  {/if}
</main>

<style>
  :root {
    --icon-size: 2rem;
  }

  .overflow-x-auto {
    overflow-x: auto;
  }
  table {
    border-collapse: collapse;
    border-spacing: 0;
    border: 1px solid #ddd;
    width: 100%;
  }
  tr:nth-child(even) {
    background-color: #f2f2f2;
  }

  .w-100 {
    width: 100%;
  }
  .add-button {
    color: green;
    font-size: var(--icon-size);
    margin: 0;
    padding: 0;
    cursor: pointer;
  }
  .save-button {
    color: blue;
    font-size: var(--icon-size);
    margin: 0;
    padding: 0;
    cursor: pointer;
  }
  button {
    border: none;
    background-image: none;
    background-color: transparent;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    cursor: pointer;
  }

  .delete-button {
    color: red;

    font-size: var(--icon-size);
  }
</style>
