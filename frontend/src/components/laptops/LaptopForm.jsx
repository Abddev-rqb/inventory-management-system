import {
  cloneElement,
  isValidElement,
  useEffect,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  Link,
} from "react-router-dom";

import {
  laptopFormDefaults,
  laptopFormSchema,
} from "../../validation/laptopFormSchema.js";


const LAPTOP_FORM_FIELDS =
  new Set([
    "company",
    "display_type",
    "model_number",
    "processor",
    "processor_generation",
    "ram_gb",
    "storage_gb",
    "storage_type",
    "serial_number",
    "wholesale_price",
    "retail_price",
    "qc_status",
    "inventory_status",
    "warranty_days",
    "area",
    "comments",
  ]);


function LaptopForm({
  initialValues =
    laptopFormDefaults,

  onSubmit,

  cancelTo = "/laptops",

  cancelState = null,

  submitLabel =
    "Create laptop",

  submittingLabel =
    "Saving...",

  serverFieldErrors = {},

  formError = null,

  lockPrices = false,
}) {
  const {
    register,
    handleSubmit,
    setError,

    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver:
      zodResolver(
        laptopFormSchema,
      ),

    defaultValues:
      initialValues,
  });


  useEffect(() => {
    Object.entries(
      serverFieldErrors,
    ).forEach(
      ([
        fieldName,
        messages,
      ]) => {
        if (
          !LAPTOP_FORM_FIELDS.has(
            fieldName,
          )
        ) {
          return;
        }

        const normalizedMessages =
          Array.isArray(
            messages,
          )
            ? messages
            : [
                messages,
              ];

        const firstMessage =
          normalizedMessages.find(
            Boolean,
          );

        if (!firstMessage) {
          return;
        }

        setError(
          fieldName,
          {
            type:
              "server",

            message:
              String(
                firstMessage,
              ),
          },
        );
      },
    );
  }, [
    serverFieldErrors,
    setError,
  ]);


  return (
    <form
      className="laptop-form"
      onSubmit={
        handleSubmit(
          onSubmit,
        )
      }
      noValidate
    >
      {formError ? (
        <div
          className="form-level-error"
          role="alert"
        >
          {formError}
        </div>
      ) : null}


      <FormSection title="Identification">
        <FormField
          label="Company"
          htmlFor="company"
          error={
            errors.company
              ?.message
          }
          required
        >
          <input
            id="company"
            type="text"
            autoComplete="organization"
            aria-invalid={
              Boolean(
                errors.company,
              )
            }
            {...register(
              "company",
            )}
          />
        </FormField>


        <FormField
          label="Display type"
          htmlFor="display_type"
          error={
            errors.display_type
              ?.message
          }
          required
        >
          <select
            id="display_type"
            aria-invalid={
              Boolean(
                errors.display_type,
              )
            }
            {...register(
              "display_type",
            )}
          >
            <option value="non_touch">
              Non-Touch
            </option>

            <option value="touch">
              Touch
            </option>
          </select>
        </FormField>


        <FormField
          label="Model number"
          htmlFor="model_number"
          error={
            errors.model_number
              ?.message
          }
          required
        >
          <input
            id="model_number"
            type="text"
            aria-invalid={
              Boolean(
                errors.model_number,
              )
            }
            {...register(
              "model_number",
            )}
          />
        </FormField>


        <FormField
          label="Serial number"
          htmlFor="serial_number"
          error={
            errors.serial_number
              ?.message
          }
          required
        >
          <input
            id="serial_number"
            type="text"
            autoComplete="off"
            aria-invalid={
              Boolean(
                errors.serial_number,
              )
            }
            {...register(
              "serial_number",
            )}
          />
        </FormField>


        <FormField
          label="Area"
          htmlFor="area"
          error={
            errors.area
              ?.message
          }
          required
        >
          <input
            id="area"
            type="text"
            placeholder="Example: Rack A"
            aria-invalid={
              Boolean(
                errors.area,
              )
            }
            {...register(
              "area",
            )}
          />
        </FormField>
      </FormSection>


      <FormSection title="Hardware">
        <FormField
          label="Processor"
          htmlFor="processor"
          error={
            errors.processor
              ?.message
          }
          required
        >
          <input
            id="processor"
            type="text"
            placeholder="Example: i5"
            aria-invalid={
              Boolean(
                errors.processor,
              )
            }
            {...register(
              "processor",
            )}
          />
        </FormField>


        <FormField
          label="Processor generation"
          htmlFor="processor_generation"
          error={
            errors
              .processor_generation
              ?.message
          }
          required
        >
          <input
            id="processor_generation"
            type="text"
            placeholder="Example: 11th"
            aria-invalid={
              Boolean(
                errors
                  .processor_generation,
              )
            }
            {...register(
              "processor_generation",
            )}
          />
        </FormField>


        <FormField
          label="RAM"
          htmlFor="ram_gb"
          hint="Enter the capacity in GB."
          error={
            errors.ram_gb
              ?.message
          }
          required
        >
          <input
            id="ram_gb"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            aria-invalid={
              Boolean(
                errors.ram_gb,
              )
            }
            {...register(
              "ram_gb",
            )}
          />
        </FormField>


        <FormField
          label="Storage"
          htmlFor="storage_gb"
          hint="Enter the capacity in GB."
          error={
            errors.storage_gb
              ?.message
          }
          required
        >
          <input
            id="storage_gb"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            aria-invalid={
              Boolean(
                errors.storage_gb,
              )
            }
            {...register(
              "storage_gb",
            )}
          />
        </FormField>


        <FormField
          label="Storage type"
          htmlFor="storage_type"
          error={
            errors.storage_type
              ?.message
          }
          required
        >
          <select
            id="storage_type"
            aria-invalid={
              Boolean(
                errors.storage_type,
              )
            }
            {...register(
              "storage_type",
            )}
          >
            <option value="ssd">
              SSD
            </option>

            <option value="hdd">
              HDD
            </option>
          </select>
        </FormField>
      </FormSection>


      <FormSection title="Pricing and stock">
        <FormField
          label="Wholesale price"
          htmlFor="wholesale_price"
          hint={
            lockPrices
              ? "View only. Only Admin users can change this price."
              : "Amount in Indian rupees."
          }
          error={
            errors
              .wholesale_price
              ?.message
          }
          required
        >
          <input
            id="wholesale_price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            readOnly={
              lockPrices
            }
            tabIndex={
              lockPrices
                ? -1
                : undefined
            }
            aria-readonly={
              lockPrices
                ? "true"
                : undefined
            }
            className={
              lockPrices
                ? "form-input-readonly"
                : undefined
            }
            aria-invalid={
              Boolean(
                errors
                  .wholesale_price,
              )
            }
            {...register(
              "wholesale_price",
            )}
          />
        </FormField>


        <FormField
          label="Retail price"
          htmlFor="retail_price"
          hint={
            lockPrices
              ? "View only. Only Admin users can change this price."
              : "Amount in Indian rupees."
          }
          error={
            errors
              .retail_price
              ?.message
          }
          required
        >
          <input
            id="retail_price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            readOnly={
              lockPrices
            }
            tabIndex={
              lockPrices
                ? -1
                : undefined
            }
            aria-readonly={
              lockPrices
                ? "true"
                : undefined
            }
            className={
              lockPrices
                ? "form-input-readonly"
                : undefined
            }
            aria-invalid={
              Boolean(
                errors
                  .retail_price,
              )
            }
            {...register(
              "retail_price",
            )}
          />
        </FormField>


        <FormField
          label="QC status"
          htmlFor="qc_status"
          error={
            errors.qc_status
              ?.message
          }
          required
        >
          <select
            id="qc_status"
            aria-invalid={
              Boolean(
                errors.qc_status,
              )
            }
            {...register(
              "qc_status",
            )}
          >
            <option value="pending">
              Pending
            </option>

            <option value="done">
              Done
            </option>
          </select>
        </FormField>


        <FormField
          label="Inventory status"
          htmlFor="inventory_status"
          error={
            errors
              .inventory_status
              ?.message
          }
          required
        >
          <select
            id="inventory_status"
            aria-invalid={
              Boolean(
                errors
                  .inventory_status,
              )
            }
            {...register(
              "inventory_status",
            )}
          >
            <option value="in_stock">
              In Stock
            </option>

            <option value="in_stock_g">
              In Stock G
            </option>

            <option value="sold">
              Sold
            </option>
          </select>
        </FormField>


        <FormField
          label="Warranty days"
          htmlFor="warranty_days"
          hint="Allowed values: 0, 7, 15 or 30 days."
          error={
            errors
              .warranty_days
              ?.message
          }
          required
        >
          <select
            id="warranty_days"
            aria-invalid={
              Boolean(
                errors
                  .warranty_days,
              )
            }
            {...register(
              "warranty_days",
            )}
          >
            <option value="0">
              No warranty
            </option>

            <option value="7">
              7 days
            </option>

            <option value="15">
              15 days
            </option>

            <option value="30">
              30 days
            </option>
          </select>
        </FormField>
      </FormSection>


      <FormSection title="Additional information">
        <FormField
          label="Comments"
          htmlFor="comments"
          error={
            errors.comments
              ?.message
          }
          fullWidth
        >
          <textarea
            id="comments"
            rows="5"
            aria-invalid={
              Boolean(
                errors.comments,
              )
            }
            {...register(
              "comments",
            )}
          />
        </FormField>
      </FormSection>


      <div className="laptop-form-actions">
        <Link
          to={
            cancelTo
          }
          state={
            cancelState
          }
          className="button button-secondary"
        >
          Cancel
        </Link>

        <button
          type="submit"
          className="button button-primary"
          disabled={
            isSubmitting
          }
        >
          {isSubmitting
            ? submittingLabel
            : submitLabel}
        </button>
      </div>
    </form>
  );
}


function FormSection({
  title,
  children,
}) {
  return (
    <section className="laptop-form-section">
      <h3>
        {title}
      </h3>

      <div className="laptop-form-grid">
        {children}
      </div>
    </section>
  );
}


function FormField({
  label,
  htmlFor,
  hint = null,
  error = null,
  required = false,
  fullWidth = false,
  children,
}) {
  const hintId =
    hint
      ? `${htmlFor}-hint`
      : null;

  const errorId =
    error
      ? `${htmlFor}-error`
      : null;

  const existingDescription =
    isValidElement(
      children,
    )
      ? children.props[
          "aria-describedby"
        ]
      : null;

  const describedBy = [
    existingDescription,
    hintId,
    errorId,
  ]
    .filter(Boolean)
    .join(" ") ||
    undefined;

  const control =
    isValidElement(
      children,
    )
      ? cloneElement(
          children,
          {
            "aria-describedby":
              describedBy,

            "aria-required":
              required ||
              children.props[
                "aria-required"
              ] ||
              undefined,
          },
        )
      : children;

  return (
    <div
      className={
        fullWidth
          ? (
              "form-field " +
              "form-field-full"
            )
          : "form-field"
      }
    >
      <label
        htmlFor={
          htmlFor
        }
      >
        {label}

        {required ? (
          <span
            className="required-marker"
            aria-hidden="true"
          >
            *
          </span>
        ) : null}
      </label>

      {control}

      {hint ? (
        <span
          id={
            hintId
          }
          className="form-field-hint"
        >
          {hint}
        </span>
      ) : null}

      {error ? (
        <span
          id={
            errorId
          }
          className="form-field-error"
          role="alert"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}


export default LaptopForm;