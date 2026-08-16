import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import AlertMessage from "../components/common/AlertMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import LaptopDetails from "../components/laptops/LaptopDetails.jsx";
import {
  parseApiError,
} from "../services/apiError.js";

import {
  useAuth,
} from "../auth/AuthContext.jsx";

import {
  deleteLaptop,
  getLaptopById,
} from "../api/laptopApi.js";

import ConfirmDialog from "../components/common/ConfirmDialog.jsx";


function LaptopDetailsPage() {
  const { laptopId } = useParams();

  const location = useLocation();
  const navigate = useNavigate();

  const { hasPermission } = useAuth();

  const canEditLaptop =
    hasPermission(
      "inventory.change_laptop",
    );

  const canDeleteLaptop =
    hasPermission(
      "inventory.delete_laptop",
    );
    
  const [
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState(null);

  const [
    successMessage,
  ] = useState(
    () =>
      location.state
        ?.successMessage ??
      null,
  );

  const [
    successTitle,
  ] = useState(
    () =>
      location.state
        ?.successTitle ??
      "Laptop updated",
  );

   const inventoryLocation =
     location.state?.inventoryLocation ??
     "/laptops";

     useEffect(() => {
      if (
        !location.state
          ?.successMessage
      ) {
        return;
      }

        navigate(
          `${location.pathname}${location.search}`,
          {
            replace: true,
            state: {
              inventoryLocation,
            },
          },
        );
      }, [
        inventoryLocation,
        location.pathname,
        location.search,
        location.state,
        navigate,
      ]);


  const [laptop, setLaptop] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState(null);

  const isValidLaptopId =
    isPositiveInteger(laptopId);

  const loadLaptop = useCallback(
    async () => {
      if (!isValidLaptopId) {
        setLaptop(null);
        setLoadError({
          message:
            "The laptop ID in the URL is invalid.",
          status: 400,
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const data =
          await getLaptopById(
            laptopId,
          );

        setLaptop(data);
      } catch (error) {
        setLaptop(null);
        setLoadError(
          parseApiError(error),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      isValidLaptopId,
      laptopId,
    ],
  );

  useEffect(() => {
    loadLaptop();
  }, [loadLaptop]);

  const isNotFound =
    loadError?.status === 404;

  function openDeleteDialog() {
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    if (isDeleting) {
      return;
    }

    setIsDeleteDialogOpen(false);
  }

  async function handleDeleteLaptop() {
    if (
      !laptop ||
      isDeleting
    ) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteLaptop(
        laptop.id,
      );

      setIsDeleteDialogOpen(false);

      navigate(
        inventoryLocation,
        {
          replace: true,
          state: {
            successTitle:
              "Laptop deleted",
            successMessage:
              `Laptop ${laptop.serial_number} was deleted successfully.`,
          },
        },
      );
    } catch (error) {
      const parsedError =
        parseApiError(error);

      setDeleteError(
        parsedError.message,
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="laptop-details-page">
      <div className="laptop-details-header">
        <div>
          <Link
            to={inventoryLocation}
            className="back-link"
          >
            ← Back to Laptop Inventory
          </Link>

          <p className="application-eyebrow">
            Laptop Inventory
          </p>

          <h2>
            {laptop
              ? `${laptop.company} ${laptop.model_number}`
              : "Laptop details"}
          </h2>
        </div>

        {laptop &&
        (
          canEditLaptop ||
          canDeleteLaptop
        ) ? (
          <div className="laptop-details-actions">
            {canEditLaptop ? (
              <Link
                to={`/laptops/${laptop.id}/edit`}
                state={{
                  inventoryLocation,
                }}
                className="button button-primary"
              >
                Edit laptop
              </Link>
            ) : null}

            {canDeleteLaptop ? (
              <button
                type="button"
                className="button button-danger"
                onClick={openDeleteDialog}
              >
                Delete laptop
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {successMessage ? (
        <AlertMessage
          variant="success"
          title={successTitle}
          message={successMessage}
        />
      ) : null}

      {deleteError ? (
        <AlertMessage
          variant="error"
          title="Laptop was not deleted"
          message={deleteError}
        />
      ) : null}

      {isLoading ? (
        <LoadingState
          title="Loading laptop details"
          message="Retrieving the laptop record from the Django API."
          size="large"
        />
      ) : null}

      {!isLoading &&
      loadError ? (
        <AlertMessage
          variant="error"
          title={
            isNotFound
              ? "Laptop not found"
              : "Unable to load laptop"
          }
          message={
            isNotFound
              ? "The requested laptop record does not exist or is no longer available."
              : loadError.message
          }
        >
          <div className="detail-error-actions">
            {!isNotFound &&
            isValidLaptopId ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={loadLaptop}
              >
                Try again
              </button>
            ) : null}

            <Link
              to={inventoryLocation}
              className="button button-primary"
            >
              Return to inventory
            </Link>
          </div>
        </AlertMessage>
      ) : null}

      {!isLoading &&
      !loadError &&
      laptop ? (
        <LaptopDetails
          laptop={laptop}
        />
      ) : null}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete laptop"
        message={
          laptop
            ? `Delete laptop ${laptop.serial_number}? This action permanently removes the inventory record.`
            : "Delete this laptop? This action permanently removes the inventory record."
        }
        confirmLabel="Delete laptop"
        cancelLabel="Cancel"
        variant="danger"
        isProcessing={isDeleting}
        onConfirm={handleDeleteLaptop}
        onCancel={closeDeleteDialog}
      />
    </section>
  );
}

function isPositiveInteger(value) {
  if (!value) {
    return false;
  }

  const numericValue = Number(value);

  return (
    Number.isInteger(numericValue) &&
    numericValue > 0 &&
    String(numericValue) === value
  );
}

export default LaptopDetailsPage;