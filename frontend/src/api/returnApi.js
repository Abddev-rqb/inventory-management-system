import axiosClient
  from "./axiosClient.js";


export async function getReturns(
  params = {},
) {
  const response =
    await axiosClient.get(
      "/returns/",
      {
        params,
      },
    );

  return response.data;
}


export async function createReturn(
  payload,
) {
  const response =
    await axiosClient.post(
      "/returns/",
      payload,
    );

  return response.data;
}


export async function getReturnTechnicians() {
  const response =
    await axiosClient.get(
      "/returns/technicians/",
    );

  return response.data;
}


export async function assignReturnPriority(
  returnId,
  priority,
) {
  const response =
    await axiosClient.patch(
      `/returns/${returnId}/priority/`,
      {
        priority,
      },
    );

  return response.data;
}


export async function assignReturnTechnician(
  returnId,
  technician,
) {
  const response =
    await axiosClient.patch(
      `/returns/${returnId}/technician/`,
      {
        technician,
      },
    );

  return response.data;
}


export async function updateReturnStatus(
  returnId,
  payload,
) {
  const response =
    await axiosClient.patch(
      `/returns/${returnId}/status/`,
      payload,
    );

  return response.data;
}

export async function stockInReturnedLaptop(
  returnId,
  payload,
) {
  const response =
    await axiosClient.patch(
      `/returns/${returnId}/stock-in/`,
      payload,
    );

  return response.data;
}

export async function getStockedInReturns(
  params = {},
) {
  const response =
    await axiosClient.get(
      "/returns/stocked-in/",
      {
        params,
      },
    );

  return response.data;
}

export async function previewReturnImport(
  file,
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    file,
  );

  const response =
    await axiosClient.post(
      "/returns/import/preview/",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      },
    );

  return response.data;
}


export async function confirmReturnImport(
  rows,
) {
  const response =
    await axiosClient.post(
      "/returns/import/confirm/",
      {
        rows,
      },
    );

  return response.data;
}


export async function exportReturns(
  params = {},
) {
  const response =
    await axiosClient.get(
      "/returns/export/",
      {
        params,
        responseType: "blob",
      },
    );

  return response;
}


export async function exportStockedInReturns(
  params = {},
) {
  const response =
    await axiosClient.get(
      "/returns/stocked-in/export/",
      {
        params,
        responseType: "blob",
      },
    );

  return response;
}

export async function updateReturn(
  returnId,
  payload,
) {
  const response =
    await axiosClient.patch(
      `/returns/${returnId}/`,
      payload,
    );

  return response.data;
}

export async function createReturnExpense(
  returnId,
  payload,
) {
  const response =
    await axiosClient.post(
      `/returns/${returnId}/expenses/`,
      payload,
    );

  return response.data;
}


export async function getReturnExpenses(
  params = {},
) {
  const response =
    await axiosClient.get(
      "/returns/expenses/",
      { params },
    );

  return response.data;
}



export async function completeReturnRepair(
  returnId,
) {
  const response =
    await axiosClient.post(
      `/returns/${returnId}/done/`,
      {},
    );

  return response.data;
}
