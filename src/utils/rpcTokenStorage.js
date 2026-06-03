export const RPC_TOKEN_STORAGE_KEY = 'propamm-rpc-bearer-token';

export function readRpcToken() {
  try {
    return localStorage.getItem(RPC_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeRpcToken(token) {
  localStorage.setItem(RPC_TOKEN_STORAGE_KEY, token);
}

export function clearRpcToken() {
  localStorage.removeItem(RPC_TOKEN_STORAGE_KEY);
}
