import axiosClient from "./axiosClient.js";


export async function getLaptops({
  page = 1,
  pageSize = 25,
  searchTerms = [],
  ordering = "-created_at",
} = {}) {
  const search =
    buildSearchValue(
      searchTerms,
    );

  const params = {
    page,
    page_size:
      pageSize,
    ordering,
  };

  if (
    search
  ) {
    params.search =
      search;
  }

  const response =
    await axiosClient.get(
      "/laptops/",
      {
        params,
      },
    );

  return response.data;
}


export async function createLaptop(
  laptopData,
) {
  const response =
    await axiosClient.post(
      "/laptops/",
      laptopData,
    );

  return response.data;
}


export async function getLaptopById(
  laptopId,
) {
  const response =
    await axiosClient.get(
      `/laptops/${laptopId}/`,
    );

  return response.data;
}


export async function updateLaptop(
  laptopId,
  payload,
) {
  const response =
    await axiosClient.patch(
      `/laptops/${laptopId}/`,
      payload,
    );

  return response.data;
}


export async function deleteLaptop(
  laptopId,
) {
  await axiosClient.delete(
    `/laptops/${laptopId}/`,
  );
}


function buildSearchValue(
  searchTerms,
) {
  return searchTerms
    .map(
      (term) =>
        String(
          term,
        ).trim(),
    )
    .filter(Boolean)
    .map(
      quoteSearchPhrase,
    )
    .join(" ");
}


function quoteSearchPhrase(
  term,
) {
  const safeTerm =
    normalizeSearchTerm(
      term.replaceAll(
        '"',
        "",
      ),
    );

  if (
    safeTerm.includes(
      " ",
    )
  ) {
    return `"${safeTerm}"`;
  }

  return safeTerm;
}


function normalizeSearchTerm(
  term,
) {
  const normalizedValue =
    term
      .trim()
      .toLowerCase();

  const choiceAliases = {
    "non touch":
      "non_touch",

    "non-touch":
      "non_touch",

    "solid state drive":
      "ssd",

    "hard disk drive":
      "hdd",
  };

  return (
    choiceAliases[
      normalizedValue
    ] ??
    term.trim()
  );
}


export async function previewLaptopImport(
  excelFile,
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    excelFile,
  );

  const response =
    await axiosClient.post(
      "/laptops/import/preview/",
      formData,
    );

  return response.data;
}


export async function confirmLaptopImport(
  confirmationRows,
) {
  const response =
    await axiosClient.post(
      "/laptops/import/confirm/",
      {
        rows:
          confirmationRows,
      },
    );

  return response.data;
}


export async function exportLaptops(
  queryParameters = {},
) {
  const response =
    await axiosClient.get(
      "/laptops/export/",
      {
        params:
          queryParameters,

        responseType:
          "blob",
      },
    );

  return {
    blob:
      response.data,

    contentDisposition:
      response.headers[
        "content-disposition"
      ] ??
      null,

    contentType:
      response.headers[
        "content-type"
      ] ??
      null,
  };
}