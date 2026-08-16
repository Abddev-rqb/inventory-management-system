export function isValidPositiveInteger(
  value,
) {
  const number =
    Number(value);

  return (
    Number.isInteger(
      number,
    ) &&
    number >= 1
  );
}


export function isValidMoney(
  value,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  const number =
    Number(value);

  return (
    Number.isFinite(
      number,
    ) &&
    number >= 0
  );
}


export function isValidCustomItem(
  item,
) {
  if (!item) {
    return false;
  }

  return Boolean(
    String(
      item.itemName ?? "",
    ).trim() &&
    isValidPositiveInteger(
      item.quantity,
    ) &&
    isValidMoney(
      item.unitPrice,
    )
  );
}


export function validateDateRange({
  startDate,
  endDate,
}) {
  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {
    return {
      isValid: false,
      message:
        "From date cannot be later than To date.",
    };
  }

  return {
    isValid: true,
    message: "",
  };
}


export function normalizeOrderLaptopItems(
  selectedLaptops,
) {
  if (
    !selectedLaptops ||
    typeof selectedLaptops.values !==
      "function"
  ) {
    return [];
  }

  return Array.from(
    selectedLaptops.values(),
  )
    .map(
      (laptop) => ({
        laptop_id:
          Number(
            laptop.id,
          ),

        quantity: 1,
      }),
    )
    .filter(
      (item) =>
        Number.isInteger(
          item.laptop_id,
        ) &&
        item.laptop_id > 0,
    );
}


export function normalizeCustomItems(
  customItems,
) {
  if (
    !Array.isArray(
      customItems,
    )
  ) {
    return [];
  }

  return customItems
    .filter(
      isValidCustomItem,
    )
    .map(
      (item) => ({
        item_name:
          String(
            item.itemName,
          ).trim(),

        quantity:
          Number(
            item.quantity,
          ),

        unit_price:
          Number(
            item.unitPrice,
          ).toFixed(
            2,
          ),
      }),
    );
}