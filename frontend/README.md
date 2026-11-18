# ADB Inventory frontend

Frontend-only MVP for the IT store room. It currently runs against MSW fixtures; no backend or database implementation is included.

The supplied Agricultural Development Bank logo is used in the app chrome and as the browser favicon. The palette is sampled from the image: heritage green `#026C3A` and bright green `#3CA61B`.

## Run locally

```sh
npm install
npm run dev
npm test
npm run build
```

In development, requests are mocked by default. Set `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL` in a local `.env` file to point the frontend at an agreed backend. Never place LDAP credentials, secrets, or authentication logic in browser code.

## MVP scope

- Login screen that delegates sign-in to the backend.
- Inventory overview with current item counts, low-stock prompts, and recent movements.
- Searchable item/current-stock list.
- Stock IN and OUT entry with client-side form validation and server-side error display.
- Stock OUT recipient branch/unit and collector, and Stock IN paper requisition reference.
- Movement history.

Digital requisitions, approval flows, branch/warehouse workflows, multiple stores, shelf/bin tracking, and an audit log UI are intentionally deferred. The audit view should only be added if the backend exposes an agreed audit API and its permissions/retention behavior are defined.

## Partner integration gates

Agree on these items before replacing mocks:

1. **API contract:** publish/version an OpenAPI document for session login/logout, current user, items, summary/low-stock data, movement history, and movement creation. Confirm endpoint paths, pagination, search, IDs, numeric units, timestamps/time zone, error payloads, and whether item/location IDs are scoped to a store. These fixture shapes live in `src/types/inventory.ts`.
2. **Session and CSRF:** the client sends `credentials: "include"` for same-site session cookies. Agree whether the app and API are same-origin or cross-origin, cookie flags and CORS allow-list, login/logout/current-session endpoints, CSRF-token issuance and header name, and session expiry/401 behavior. Add CSRF handling to `src/lib/api.ts` only after that contract is agreed. The login form does not retain credentials.
3. **Authority and access:** backend is authoritative for identity, authorization, stock balances, reorder thresholds/alerts, and movement creation. It must reject unauthorized changes and stock-out quantities exceeding available balances; frontend checks are for usability only.
4. **Integration sequence:** partner publishes the contract and a reachable dev API; frontend replaces `src/mocks/handlers.ts` while keeping the typed API module; validate login/session behavior, role permissions, error/empty/loading states, and movement reconciliation against that API before deployment.
5. **Extension points:** keep location/store identity in API resources when the partner's model is ready; avoid hard-coding the current single-store assumption into new API behavior. Build requisitions, approvals, and shelf tracking only in a later agreed phase.

The session `currentStoreName` and `permissions` and the optional store/location/recipient fields in `src/types/inventory.ts` are frontend fixture assumptions for display and navigation only; they are not an agreed backend schema or security boundary. Confirm their names and shape with the partner before integration. Server authorization remains mandatory.

Mock login accepts any syntactically valid work email and non-empty password. This is demo behavior only, not authentication.
