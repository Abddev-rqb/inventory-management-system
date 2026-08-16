import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";

function InventoryActions({
  inventoryLocation =
    "/laptops",
  canAddLaptop = false,
  canExportLaptops = false,
  isExporting = false,
  onExport,
}) {
  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false);

  const menuContainerRef =
    useRef(null);

  useEffect(() => {
    function handleDocumentClick(
      event,
    ) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(
          event.target,
        )
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleEscapeKey(
      event,
    ) {
      if (
        event.key === "Escape"
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleDocumentClick,
    );

    document.addEventListener(
      "keydown",
      handleEscapeKey,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscapeKey,
      );
    };
  }, []);

  function toggleMenu() {
    setIsMenuOpen(
      (currentValue) =>
        !currentValue,
    );
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  async function handleExportClick() {
    if (
      !canExportLaptops ||
      isExporting
    ) {
      return;
    }

    closeMenu();

    if (
      typeof onExport ===
      "function"
    ) {
      await onExport();
    }
  }

  return (
    <div className="inventory-actions">
      {canAddLaptop ? (
        <Link
          to="/laptops/new"
          state={{
            inventoryLocation,
          }}
          className="button button-primary"
        >
          Add +
        </Link>
      ) : null}

      <div
        ref={menuContainerRef}
        className="inventory-action-menu"
      >
        <button
          type="button"
          className="button button-secondary"
          onClick={toggleMenu}
          aria-haspopup="menu"
          aria-expanded={
            isMenuOpen
          }
        >
          Import / Export
        </button>

        {isMenuOpen ? (
          <div
            className="inventory-action-dropdown"
            role="menu"
          >
            {canAddLaptop ? (
              <Link
                to="/laptops/import"
                state={{
                  inventoryLocation,
                }}
                className="inventory-action-dropdown-item"
                role="menuitem"
                onClick={closeMenu}
              >
                Import Excel
              </Link>
            ) : null}

            {canExportLaptops ? (
              <button
                type="button"
                className="inventory-action-dropdown-item"
                role="menuitem"
                onClick={
                  handleExportClick
                }
                disabled={
                  isExporting
                }
              >
                {isExporting
                  ? "Exporting..."
                  : "Export Excel"}
              </button>
            ) : null}

            {!canAddLaptop &&
            !canExportLaptops ? (
              <span className="inventory-action-dropdown-empty">
                No actions available
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default InventoryActions;
