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
  canBulkManage = false,
  isExporting = false,
  onExport,
  onStartBulkDelete,
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

  function handleBulkDeleteClick() {
    if (!canBulkManage) {
      return;
    }

    closeMenu();

    if (
      typeof onStartBulkDelete ===
      "function"
    ) {
      onStartBulkDelete();
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
                Import New Laptops
              </Link>
            ) : null}

            {canBulkManage ? (
              <Link
                to="/laptops/import?mode=update"
                state={{
                  inventoryLocation,
                }}
                className="inventory-action-dropdown-item"
                role="menuitem"
                onClick={closeMenu}
              >
                Bulk Update Existing
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

            {canBulkManage ? (
              <button
                type="button"
                className="inventory-action-dropdown-item inventory-action-dropdown-danger"
                role="menuitem"
                onClick={
                  handleBulkDeleteClick
                }
              >
                Bulk Delete
              </button>
            ) : null}

            {!canAddLaptop &&
            !canExportLaptops &&
            !canBulkManage ? (
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
