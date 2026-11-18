let accessToken: string | null = null;

export const session = {
  get token() {
    return accessToken;
  },
  setToken(token: string) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
  },
};

export const unauthorizedEvent = "konditerskaya:unauthorized";
