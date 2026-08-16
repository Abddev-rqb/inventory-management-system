import {
  z,
} from "zod";


const DISPLAY_TYPES = [
  "touch",
  "non_touch",
];


const STORAGE_TYPES = [
  "ssd",
  "hdd",
];


const QC_STATUSES = [
  "pending",
  "done",
];


const INVENTORY_STATUSES = [
  "in_stock",
  "in_stock_g",
  "in_service",
  "sold",
];


const WARRANTY_DAYS = [
  0,
  7,
  15,
  30,
];


const requiredText = (
  fieldLabel,
  maximumLength = 255,
) =>
  z
    .string()
    .trim()
    .min(
      1,
      `${fieldLabel} is required.`,
    )
    .max(
      maximumLength,
      (
        `${fieldLabel} must not exceed ` +
        `${maximumLength} characters.`
      ),
    );


const positiveInteger = (
  fieldLabel,
) =>
  z.coerce
    .number({
      invalid_type_error:
        `${fieldLabel} must be a number.`,
    })
    .int(
      `${fieldLabel} must be a whole number.`,
    )
    .positive(
      (
        `${fieldLabel} must be ` +
        "greater than zero."
      ),
    );


const nonNegativeInteger = (
  fieldLabel,
) =>
  z.coerce
    .number({
      invalid_type_error:
        `${fieldLabel} must be a number.`,
    })
    .int(
      `${fieldLabel} must be a whole number.`,
    )
    .min(
      0,
      `${fieldLabel} cannot be negative.`,
    );


const nonNegativePrice = (
  fieldLabel,
) =>
  z.coerce
    .number({
      invalid_type_error:
        `${fieldLabel} must be a number.`,
    })
    .finite(
      `${fieldLabel} must be a valid number.`,
    )
    .min(
      0,
      `${fieldLabel} cannot be negative.`,
    );


export const laptopFormSchema =
  z
    .object({
      company:
        requiredText(
          "Company",
          120,
        ),

      display_type:
        z.enum(
          DISPLAY_TYPES,
          {
            errorMap: () => ({
              message:
                "Select a valid display type.",
            }),
          },
        ),

      model_number:
        requiredText(
          "Model number",
          120,
        ),

      processor:
        requiredText(
          "Processor",
          120,
        ),

      processor_generation:
        requiredText(
          "Processor generation",
          50,
        ),

      ram_gb:
        positiveInteger(
          "RAM",
        ),

      storage_gb:
        positiveInteger(
          "Storage",
        ),

      storage_type:
        z.enum(
          STORAGE_TYPES,
          {
            errorMap: () => ({
              message:
                "Select a valid storage type.",
            }),
          },
        ),

      serial_number:
        requiredText(
          "Serial number",
          120,
        ),

      wholesale_price:
        nonNegativePrice(
          "Wholesale price",
        ),

      retail_price:
        nonNegativePrice(
          "Retail price",
        ),

      qc_status:
        z.enum(
          QC_STATUSES,
          {
            errorMap: () => ({
              message:
                "Select a valid QC status.",
            }),
          },
        ),

      inventory_status:
        z.enum(
          INVENTORY_STATUSES,
          {
            errorMap: () => ({
              message:
                (
                  "Select a valid " +
                  "inventory status."
                ),
            }),
          },
        ),

      warranty_days:
        nonNegativeInteger(
          "Warranty days",
        ).refine(
          (value) =>
            WARRANTY_DAYS.includes(
              value,
            ),
          {
            message:
              (
                "Warranty must be 0, 7, " +
                "15 or 30 days."
              ),
          },
        ),

      area:
        requiredText(
          "Area",
          120,
        ),

      comments:
        z
          .string()
          .trim()
          .max(
            1000,
            (
              "Comments must not exceed " +
              "1000 characters."
            ),
          )
          .optional()
          .default(""),
    })
    .superRefine(
      (
        values,
        context,
      ) => {
        if (
          values.retail_price <
          values.wholesale_price
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "retail_price",
            ],

            message:
              (
                "Retail price must be " +
                "greater than or equal to " +
                "the wholesale price."
              ),
          });
        }
      },
    );


export const laptopFormDefaults = {
  company: "",

  display_type:
    "non_touch",

  model_number:
    "",

  processor:
    "",

  processor_generation:
    "",

  ram_gb:
    "",

  storage_gb:
    "",

  storage_type:
    "ssd",

  serial_number:
    "",

  wholesale_price:
    "",

  retail_price:
    "",

  qc_status:
    "pending",

  inventory_status:
    "in_stock",

  warranty_days:
    0,

  area:
    "",

  comments:
    "",
};