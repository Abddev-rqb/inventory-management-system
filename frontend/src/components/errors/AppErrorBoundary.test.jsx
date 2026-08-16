import {
  render,
  screen,
} from "@testing-library/react";
import {
  MemoryRouter,
} from "react-router-dom";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AppErrorBoundary from "./AppErrorBoundary.jsx";


function BrokenComponent() {
  throw new Error(
    "Test render error",
  );
}


function renderWithRouter(
  component,
) {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>,
  );
}


describe(
  "AppErrorBoundary",
  () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it(
      "renders children when no error occurs",
      () => {
        renderWithRouter(
          <AppErrorBoundary>
            <p>
              Application content
            </p>
          </AppErrorBoundary>,
        );

        expect(
          screen.getByText(
            "Application content",
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "shows the fallback UI when a child crashes",
      () => {
        vi.spyOn(
          console,
          "error",
        ).mockImplementation(
          () => {},
        );

        renderWithRouter(
          <AppErrorBoundary>
            <BrokenComponent />
          </AppErrorBoundary>,
        );

        expect(
          screen.queryByText(
            "Application content",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);