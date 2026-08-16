import axiosClient from "./axiosClient.js";


export async function loginUser(
  username,
  password,
) {
  const response =
    await axiosClient.post(
      "/auth/token/",
      {
        username,
        password,
      },
    );

  return response.data;
}