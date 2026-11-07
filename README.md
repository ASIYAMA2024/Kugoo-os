# KUGOO Dashboard

Offline-first, installable PWA starter for read-only monitoring of a Kugoo Wish 01 / Tuttio Soleil 01.

## Current implementation status

### Working
- Responsive dashboard UI with Ride, Statistics, Battery, Diagnostics, Bluetooth and Settings pages.
- Original KUGOO-inspired dark cockpit styling and selectable accent colours.
- Demo telemetry toggle. Demo readings are explicitly labelled and are not represented as real bike data.
- Local ride session records in IndexedDB.
- CSV and JSON ride-history export.
- PWA manifest and service-worker precaching via `vite-plugin-pwa`.
- BLE device discovery and GATT connection/disconnection UI.
- Screen wake lock and browser full-screen requests where supported.
- No account, cloud backend, analytics, ads or remote ride storage.

### Not implemented / awaiting verification
- FarDriver ND72450 telemetry decoding.
- JBD DB24SA05L24S100A telemetry decoding and cell data.
- Automatic BLE reconnection.
- Verified battery percentage, energy usage, temperature, faults and warning thresholds.
- True distance/speed logging from bike sensors.
- Background logging while the browser is suspended.

**Important:** Bluetooth pairing in this starter only discovers a device and opens its GATT connection. It does not read characteristics. No UUIDs, packet formats, scaling factors, authentication or write operations are guessed. A successful GATT connection is not proof of protocol compatibility.

## Requirements
- Node.js 20.19+ or 22.12+
- npm
- GitHub account and Vercel account for deployment

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For Web Bluetooth testing, use a supported Chromium-based browser and a secure context (localhost is treated as secure). Bluetooth support varies by browser and device.

## Build

```bash
npm run build
npm run preview
```

The production output is written to `dist/`.

## GitHub

1. Create a new empty GitHub repository named `kugoo-dashboard`.
2. Extract this project and open a terminal in its folder.
3. Run:

```bash
git init
git add .
git commit -m "Initial KUGOO dashboard PWA"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/kugoo-dashboard.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## Vercel deployment

1. Sign in to Vercel and choose **Add New → Project**.
2. Import the `kugoo-dashboard` GitHub repository.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. No environment variables are required.
7. Deploy. Future pushes to the connected branch trigger deployments.

Use the deployed HTTPS URL when installing the PWA and testing Bluetooth. Web Bluetooth requires a secure context and is not supported in every browser.

## Install on Android

1. Open the deployed HTTPS website in a supported Chromium browser.
2. Use the browser menu and choose **Install app** or **Add to Home screen**.
3. Launch KUGOO from the home screen.
4. Open it once while online so the service worker can cache the app shell and assets.

The service worker caches the app shell for offline launch after the first successful load. Bluetooth connections still require Bluetooth hardware and a supported browser; offline installation does not make an unavailable BLE protocol work.

## Local data and privacy

Ride records are stored in IndexedDB in the browser profile on the phone. Settings are stored locally. Clearing site data or uninstalling/clearing the browser profile may remove this information. Export ride history regularly if you want a separate copy.

## Bluetooth protocol integration plan

Before implementing either adapter, obtain:
- Manufacturer documentation or protocol captures made with permission.
- Confirmed service and characteristic UUIDs.
- Confirmed notification/read behaviour.
- Packet framing, byte order, scaling and signedness.
- Unit definitions and validity/range rules.
- Authentication/pairing requirements, if any.

Implement separate read-only adapters in `src/` for FarDriver and JBD. Validate every frame and expose unavailable/invalid/disconnected states separately from numeric zero. Do not add characteristic writes. Test with captured fixtures before connecting to the actual bike.

### Browser BLE limitations

Web Bluetooth is primarily available in Chromium-based browsers on secure origins. Device selection requires a user gesture. Browser/OS policies can limit simultaneous GATT connections, background operation and reconnection after a process is suspended. This project attempts separate user-initiated connections, but does not promise stable simultaneous/background operation.

If simultaneous connections prove unreliable, the robust alternative is a small Android native BLE bridge (for example, a Kotlin Android app/service) that maintains both BLE connections and exposes a local WebSocket to this PWA. Keep the bridge read-only and document its protocol. A native bridge is not included in this repository.

## Safety scope

This is a read-only monitoring interface. It must not send controller tuning, motor-control or BMS configuration commands. Do not treat the app as a substitute for the bike's original protection systems or manufacturer documentation.
