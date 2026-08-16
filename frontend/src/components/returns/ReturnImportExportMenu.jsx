import {
  useEffect,
  useRef,
  useState,
} from "react";


function ReturnImportExportMenu({
  canImport,
  canExport,
  isExporting,
  onImport,
  onExport,
}) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const wrapperRef =
    useRef(null);


  useEffect(() => {
    function handleOutsideClick(
      event,
    ) {
      if (
        wrapperRef.current
        &&
        !wrapperRef.current
          .contains(
            event.target,
          )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);


  return (
    <div
      ref={wrapperRef}
      className="return-import-export-menu"
    >
      <button
        type="button"
        className="button button-secondary"
        aria-haspopup="menu"
        aria-expanded={
          isOpen
        }
        onClick={() =>
          setIsOpen(
            (current) =>
              !current,
          )
        }
      >
        Import / Export
      </button>


      {isOpen ? (
        <div
          className="return-import-export-dropdown"
          role="menu"
        >
          {canImport ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onImport();
              }}
            >
              Import Excel
            </button>
          ) : null}


          {canExport ? (
            <button
              type="button"
              role="menuitem"
              disabled={
                isExporting
              }
              onClick={() => {
                setIsOpen(false);
                onExport();
              }}
            >
              {isExporting
                ? "Exporting..."
                : "Export Excel"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


export default ReturnImportExportMenu;