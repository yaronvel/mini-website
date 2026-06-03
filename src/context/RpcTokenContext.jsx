import { createContext, useContext, useEffect, useState } from 'react';
import {
  readRpcToken,
  writeRpcToken,
  clearRpcToken as clearStoredRpcToken
} from '../utils/rpcTokenStorage';

const RpcTokenContext = createContext(null);

export function RpcTokenProvider({ children }) {
  const [bearerToken, setBearerToken] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [draftToken, setDraftToken] = useState('');

  useEffect(() => {
    setBearerToken(readRpcToken());
    setHydrated(true);
  }, []);

  function saveToken(token) {
    const trimmed = token.trim();
    if (!trimmed) return;
    writeRpcToken(trimmed);
    setBearerToken(trimmed);
    setDraftToken('');
  }

  function clearToken() {
    clearStoredRpcToken();
    setBearerToken(null);
    setDraftToken('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveToken(draftToken);
  }

  const showPrompt = hydrated && !bearerToken;

  return (
    <RpcTokenContext.Provider value={{ bearerToken, saveToken, clearToken, hydrated }}>
      {showPrompt && (
        <div className="rpc-token-overlay" role="dialog" aria-modal="true" aria-labelledby="rpc-token-title">
          <div className="rpc-token-dialog">
            <h2 id="rpc-token-title">RPC access token</h2>
            <p className="rpc-token-description">
              This site uses the 1inch Base archive RPC. Enter your bearer token to load on-chain data.
              It is stored in this browser only.
            </p>
            <form onSubmit={handleSubmit}>
              <label className="rpc-token-label" htmlFor="rpc-token-input">
                Bearer token
              </label>
              <input
                id="rpc-token-input"
                className="rpc-token-input"
                type="password"
                value={draftToken}
                onChange={(event) => setDraftToken(event.target.value)}
                autoComplete="off"
                autoFocus
                required
              />
              <button type="submit" className="rpc-token-submit" disabled={!draftToken.trim()}>
                Save and continue
              </button>
            </form>
          </div>
        </div>
      )}
      {hydrated && bearerToken ? children : null}
    </RpcTokenContext.Provider>
  );
}

export function useRpcToken() {
  const context = useContext(RpcTokenContext);
  if (!context) {
    throw new Error('useRpcToken must be used within RpcTokenProvider');
  }
  return context;
}

export function RpcTokenNavButton() {
  const { bearerToken, clearToken } = useRpcToken();
  if (!bearerToken) return null;

  return (
    <button type="button" className="rpc-token-clear-btn" onClick={clearToken}>
      Clear RPC token
    </button>
  );
}
