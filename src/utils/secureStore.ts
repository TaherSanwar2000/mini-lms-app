import * as SecureStore from "expo-secure-store";

export const setToken = async (token: string) => {
  await SecureStore.setItemAsync("token", token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync("token");
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync("token");
};