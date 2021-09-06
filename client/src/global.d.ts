/// <reference types="svelte" />

interface Car {
  model?: string;
  make?: string;
  year?: number | string;
  _id?: string;
}

interface CustomInputEvent extends InputEvent {
  target: HTMLInputElement;
}

interface User {
  username?: string;
  headers?: {
    authorization: string;
  };
}
