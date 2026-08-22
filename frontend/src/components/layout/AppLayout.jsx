import {
  useEffect,
  useState,
} from "react";
import {
  Outlet,
  useLocation,
} from "react-router-dom";

import ApplicationHeader from "./ApplicationHeader.jsx";
import ApplicationSidebar from "./ApplicationSidebar.jsx";


function AppLayout() {
  const location = useLocation();

  const [
    isMobileNavigationOpen,
    setIsMobileNavigationOpen,
  ] = useState(false);


  useEffect(() => {
    setIsMobileNavigationOpen(
      false,
    );
  }, [
    location.pathname,
  ]);


  useEffect(() => {
    if (
      !isMobileNavigationOpen
    ) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setIsMobileNavigationOpen(
          false,
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    isMobileNavigationOpen,
  ]);


  function handleToggleNavigation() {
    setIsMobileNavigationOpen(
      (isOpen) =>
        !isOpen,
    );
  }


  function handleCloseNavigation() {
    setIsMobileNavigationOpen(
      false,
    );
  }


  return (
    <div className="application-layout">
      <ApplicationHeader
        isMobileNavigationOpen={
          isMobileNavigationOpen
        }
        onToggleMobileNavigation={
          handleToggleNavigation
        }
      />

      <div className="application-body">
        <aside
          id="application-sidebar"
          className={[
            "application-sidebar",
            isMobileNavigationOpen
              ? "application-sidebar-open"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="mobile-sidebar-header">
            <strong>
              Navigation
            </strong>

            <button
              type="button"
              className="mobile-sidebar-close"
              aria-label="Close navigation menu"
              onClick={
                handleCloseNavigation
              }
            >
              ×
            </button>
          </div>

          <ApplicationSidebar
            onNavigate={
              handleCloseNavigation
            }
          />
        </aside>

        <button
          type="button"
          className={[
            "mobile-navigation-backdrop",
            isMobileNavigationOpen
              ? "mobile-navigation-backdrop-visible"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Close navigation menu"
          tabIndex={
            isMobileNavigationOpen
              ? 0
              : -1
          }
          onClick={
            handleCloseNavigation
          }
        />

        <main className="application-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


export default AppLayout;
