const STORAGE_KEY = "yumc_bamboo_anon_token";

export function getAnonToken(): string {
  if (typeof window === "undefined") return "";

  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}
