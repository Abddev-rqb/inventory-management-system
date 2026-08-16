import axiosClient from "./axiosClient.js";


export async function getManagedUsers(
  params = {},
) {
  const response =
    await axiosClient.get(
      "/users/",
      {
        params,
      },
    );

  return response.data;
}


export async function getAssignableRoles() {
  const response =
    await axiosClient.get(
      "/users/roles/",
    );

  return response.data;
}


export async function createManagedUser(
  payload,
) {
  const response =
    await axiosClient.post(
      "/users/",
      payload,
    );

  return response.data;
}


export async function updateManagedUser(
  userId,
  payload,
) {
  const response =
    await axiosClient.patch(
      `/users/${userId}/`,
      payload,
    );

  return response.data;
}


export async function deleteManagedUser(
  userId,
) {
  const response =
    await axiosClient.delete(
      `/users/${userId}/`,
    );

  return response.data;
}