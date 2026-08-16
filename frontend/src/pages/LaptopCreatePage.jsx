import {
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  createLaptop,
} from "../api/laptopApi.js";

import AlertMessage from "../components/common/AlertMessage.jsx";
import LaptopForm from "../components/laptops/LaptopForm.jsx";

import {
  parseApiError,
} from "../services/apiError.js";


function LaptopCreatePage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    formError,
    setFormError,
  ] = useState(null);

  const [
    serverFieldErrors,
    setServerFieldErrors,
  ] = useState({});

  const inventoryLocation =
    location.state
      ?.inventoryLocation ??
    "/laptops";


  async function handleCreateLaptop(
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

      const createdLaptop =
        await createLaptop(
          payload,
        );

      navigate(
        `/laptops/${createdLaptop.id}`,
        {
          replace: true,

          state: {
            inventoryLocation,

            successTitle:
              "Laptop created",

            successMessage:
              (
                `Laptop ` +
                `${createdLaptop.serial_number} ` +
                `was created successfully.`
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


  return (
    <section className="laptop-create-page">
      <div className="laptop-form-page-header">
        <div>
          <Link
            to={
              inventoryLocation
            }
            className="back-link"
          >
            ← Back to Laptop Inventory
          </Link>

          <p className="application-eyebrow">
            Laptop Inventory
          </p>

          <h2>
            Add laptop
          </h2>

          <p className="page-description">
            Create a new laptop inventory record.
          </p>
        </div>
      </div>

      {formError ? (
        <AlertMessage
          variant="error"
          title="Laptop was not created"
          message={
            formError
          }
        />
      ) : null}

      <LaptopForm
        onSubmit={
          handleCreateLaptop
        }
        cancelTo={
          inventoryLocation
        }
        submitLabel="Create laptop"
        submittingLabel="Creating..."
        formError={
          null
        }
        serverFieldErrors={
          serverFieldErrors
        }
      />
    </section>
  );
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


export default LaptopCreatePage;