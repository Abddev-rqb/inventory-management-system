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

import {
  getLaptopById,
  updateLaptop,
} from "../api/laptopApi.js";

import {
  useAuth,
} from "../auth/AuthContext.jsx";

import AlertMessage from "../components/common/AlertMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import LaptopForm from "../components/laptops/LaptopForm.jsx";

import {
  parseApiError,
} from "../services/apiError.js";


function LaptopEditPage() {
  const {
    laptopId,
  } = useParams();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();

  const [
    laptop,
    setLaptop,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState(null);

  const [
    formError,
    setFormError,
  ] = useState(null);

  const [
    serverFieldErrors,
    setServerFieldErrors,
  ] = useState({});


  const isSales =
    user?.role ===
    "sales";

  const isValidLaptopId =
    isPositiveInteger(
      laptopId,
    );

  const inventoryLocation =
    location.state
      ?.inventoryLocation ??
    "/laptops";

  const detailsLocation =
    `/laptops/${laptopId}`;


  const loadLaptop =
    useCallback(
      async () => {
        if (
          !isValidLaptopId
        ) {
          setLaptop(
            null,
          );

          setLoadError({
            status:
              400,

            message:
              (
                "The laptop ID in the URL " +
                "is invalid."
              ),
          });

          setIsLoading(
            false,
          );

          return;
        }

        setIsLoading(
          true,
        );

        setLoadError(
          null,
        );

        try {
          const data =
            await getLaptopById(
              laptopId,
            );

          setLaptop(
            data,
          );
        } catch (error) {
          setLaptop(
            null,
          );

          setLoadError(
            parseApiError(
              error,
            ),
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [
        isValidLaptopId,
        laptopId,
      ],
    );


  useEffect(() => {
    loadLaptop();
  }, [
    loadLaptop,
  ]);


  async function handleUpdateLaptop(
    formValues,
  ) {
    setFormError(
      null,
    );

    setServerFieldErrors(
      {},
    );

    try {
      const payload =
        normalizeLaptopPayload(
          formValues,
        );

      /*
       * Sales can edit normal inventory
       * information, but both prices are
       * controlled by Admin.
       *
       * Prices are therefore completely
       * removed from the PATCH payload.
       */
      if (
        isSales
      ) {
        delete (
          payload
            .wholesale_price
        );

        delete (
          payload
            .retail_price
        );
      }

      const updatedLaptop =
        await updateLaptop(
          laptopId,
          payload,
        );

      navigate(
        `/laptops/${updatedLaptop.id}`,
        {
          replace:
            true,

          state: {
            inventoryLocation,

            successTitle:
              "Laptop updated",

            successMessage:
              (
                `Laptop ` +
                `${updatedLaptop.serial_number} ` +
                `was updated successfully.`
              ),
          },
        },
      );
    } catch (error) {
      const parsedError =
        parseApiError(
          error,
        );

      setFormError(
        parsedError.message,
      );

      setServerFieldErrors(
        parsedError.fields ??
          {},
      );
    }
  }


  const isNotFound =
    loadError?.status ===
    404;


  return (
    <section className="laptop-edit-page">
      <div className="laptop-form-page-header">
        <div>
          <Link
            to={
              detailsLocation
            }
            state={{
              inventoryLocation,
            }}
            className="back-link"
          >
            ← Back to Laptop Details
          </Link>

          <p className="application-eyebrow">
            Laptop Inventory
          </p>

          <h2>
            Edit laptop
          </h2>

          <p className="page-description">
            Update the existing laptop inventory record.
          </p>
        </div>
      </div>


      {isLoading ? (
        <LoadingState
          title="Loading laptop"
          message={
            (
              "Retrieving the current laptop " +
              "values from the Django API."
            )
          }
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
              ? (
                  "The requested laptop record " +
                  "does not exist or is no " +
                  "longer available."
                )
              : loadError.message
          }
        >
          <div className="detail-error-actions">
            {!isNotFound &&
            isValidLaptopId ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={
                  loadLaptop
                }
              >
                Try again
              </button>
            ) : null}

            <Link
              to={
                inventoryLocation
              }
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
        <>
          {formError ? (
            <AlertMessage
              variant="error"
              title="Laptop was not updated"
              message={
                formError
              }
            />
          ) : null}

          <LaptopForm
            initialValues={
              mapLaptopToFormValues(
                laptop,
              )
            }
            onSubmit={
              handleUpdateLaptop
            }
            cancelTo={
              detailsLocation
            }
            cancelState={{
              inventoryLocation,
            }}
            submitLabel="Save changes"
            submittingLabel="Saving changes..."
            formError={
              null
            }
            serverFieldErrors={
              serverFieldErrors
            }
            lockPrices={
              isSales
            }
          />
        </>
      ) : null}
    </section>
  );
}


function mapLaptopToFormValues(
  laptop,
) {
  return {
    company:
      laptop.company ??
      "",

    display_type:
      laptop.display_type ??
      "non_touch",

    model_number:
      laptop.model_number ??
      "",

    processor:
      laptop.processor ??
      "",

    processor_generation:
      laptop.processor_generation ??
      "",

    ram_gb:
      laptop.ram_gb ??
      "",

    storage_gb:
      laptop.storage_gb ??
      "",

    storage_type:
      laptop.storage_type ??
      "ssd",

    serial_number:
      laptop.serial_number ??
      "",

    wholesale_price:
      laptop.wholesale_price ??
      "",

    retail_price:
      laptop.retail_price ??
      "",

    qc_status:
      laptop.qc_status ??
      "pending",

    inventory_status:
      laptop.inventory_status ??
      "in_stock",

    warranty_days:
      laptop.warranty_days ??
      0,

    area:
      laptop.area ??
      "",

    comments:
      laptop.comments ??
      "",
  };
}


function normalizeLaptopPayload(
  values,
) {
  return {
    company:
      values.company.trim(),

    display_type:
      values.display_type,

    model_number:
      values.model_number.trim(),

    processor:
      values.processor.trim(),

    processor_generation:
      values.processor_generation.trim(),

    ram_gb:
      Number(
        values.ram_gb,
      ),

    storage_gb:
      Number(
        values.storage_gb,
      ),

    storage_type:
      values.storage_type,

    serial_number:
      values.serial_number.trim(),

    wholesale_price:
      values.wholesale_price,

    retail_price:
      values.retail_price,

    qc_status:
      values.qc_status,

    inventory_status:
      values.inventory_status,

    warranty_days:
      Number(
        values.warranty_days,
      ),

    area:
      values.area.trim(),

    comments:
      values.comments
        ?.trim() ??
      "",
  };
}


function isPositiveInteger(
  value,
) {
  if (!value) {
    return false;
  }

  const numericValue =
    Number(
      value,
    );

  return (
    Number.isInteger(
      numericValue,
    ) &&
    numericValue > 0 &&
    String(
      numericValue,
    ) === value
  );
}


export default LaptopEditPage;