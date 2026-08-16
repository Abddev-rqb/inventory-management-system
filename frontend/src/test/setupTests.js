import {
  cleanup,
} from "@testing-library/react";
import {
  afterEach,
  vi,
} from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

if (
  typeof HTMLDialogElement !==
  "undefined"
) {
  HTMLDialogElement.prototype.showModal =
    vi.fn(function showModal() {
      this.open = true;
    });

  HTMLDialogElement.prototype.close =
    vi.fn(function close() {
      this.open = false;
    });
}

if (
  !globalThis.URL.createObjectURL
) {
  globalThis.URL.createObjectURL =
    vi.fn(() =>
      "blob:test-download",
    );
}

if (
  !globalThis.URL.revokeObjectURL
) {
  globalThis.URL.revokeObjectURL =
    vi.fn();
}

Object.defineProperty(
  window,
  "scrollTo",
  {
    configurable: true,
    value: vi.fn(),
  },
);