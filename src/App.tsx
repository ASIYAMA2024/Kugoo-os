import React, { useEffect, useRef, useState } from "react";

type Page =
  | "ride"
  | "statistics"
  | "battery"
  | "diagnostics"
  | "bluetooth"
  | "settings";

type Theme = "dark" | "light";

type Ride = {
  id: number;
  date: string;
  distance: number;
  duration: number;
};

type Telemetry = {
  speed: number;
  battery: number;
  voltage: number;
  power: number;
  motorTemp: number | null;
  controllerTemp: number | null;
};

const initialTelemetry: Telemetry = {
  speed: 0,
  battery: 0,
  voltage: 0,
  power: 0,
  motorTemp: null,
  controllerTemp: null,
};

const pages: {
  id: Page;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "ride",
    name: "Ride",
    description: "Live dashboard",
    icon: "◉",
  },
  {
    id: "statistics",
    name: "Statistics",
    description: "Ride history and records",
    icon: "▥",
  },
  {
    id: "battery",
    name: "Battery",
    description: "Battery information",
    icon: "▰",
  },
  {
    id: "diagnostics",
    name: "Diagnostics",
    description: "System information",
    icon: "⌁",
  },
  {
    id: "bluetooth",
    name: "Bluetooth",
    description: "Device connections",
    icon: "ᛒ",
  },
  {
    id: "settings",
    name: "Settings",
    description: "Customise your dashboard",
    icon: "⚙",
  },
];

const appStyles = `
* {
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

body {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #080808;
}

button {
  font: inherit;
}

.kugoo-app {
  --bg: #080808;
  --panel: #151515;
  --panel2: #1d1d1d;
  --text: #f5f5f5;
  --muted: #888;
  --line: #292929;
  --red: #ed2525;
  --bezel: #050505;

  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: var(--bezel);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.kugoo-app.light {
  --bg: #f2f2f2;
  --panel: #ffffff;
  --panel2: #e9e9e9;
  --text: #111111;
  --muted: #777;
  --line: #dedede;
  --red: #dc2020;
  --bezel: #050505;
}

.kugoo-app.dark {
  --bezel: #f5f5f5;
}

.kugoo-device {
  width: 100%;
  height: 100%;
  max-width: 1000px;
  max-height: 100%;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.kugoo-topbar {
  height: 58px;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
}

.kugoo-top-left {
  display: flex;
  align-items: center;
  gap: 13px;
}

.kugoo-menu-button {
  width: 39px;
  height: 39px;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--text);
  background: var(--panel);
  font-size: 21px;
  cursor: pointer;
}

.kugoo-logo {
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 3px;
}

.kugoo-logo span {
  color: var(--red);
}

.kugoo-status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: var(--muted);
}

.kugoo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #777;
}

.kugoo-dot.connected {
  background: #35c978;
}

.kugoo-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.kugoo-screen {
  width: 100%;
  height: 100%;
  padding: 16px;
  animation: kugooFade 220ms ease;
}

@keyframes kugooFade {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kugoo-page-scroll {
  overflow-y: auto;
  scrollbar-width: none;
}

.kugoo-page-scroll::-webkit-scrollbar {
  display: none;
}

.kugoo-ride-screen {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.kugoo-ride-actions {
  display: flex;
  gap: 9px;
  flex-shrink: 0;
}

.kugoo-primary-button,
.kugoo-secondary-button {
  border: 0;
  border-radius: 12px;
  padding: 12px 17px;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
}

.kugoo-primary-button {
  background: var(--red);
  color: white;
}

.kugoo-secondary-button {
  background: var(--panel2);
  color: var(--text);
}

.kugoo-speed-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 19px;
  padding: 13px 18px;
  text-align: center;
  flex: 1.25;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kugoo-speed-label {
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 700;
}

.kugoo-speed {
  font-size: clamp(64px, 15vw, 112px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -5px;
  font-variant-numeric: tabular-nums;
}

.kugoo-speed-unit {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

.kugoo-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  flex-shrink: 0;
}

.kugoo-stat-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 15px;
  padding: 11px 13px;
  min-width: 0;
}

.kugoo-stat-label {
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.kugoo-stat-value {
  font-size: clamp(20px, 5vw, 27px);
  font-weight: 850;
  margin-top: 5px;
  font-variant-numeric: tabular-nums;
}

.kugoo-stat-unit {
  font-size: 11px;
  color: var(--muted);
  margin-left: 4px;
}

.kugoo-notice {
  color: var(--muted);
  font-size: 10px;
  text-align: center;
  padding: 4px 0;
  flex-shrink: 0;
}

.kugoo-heading {
  font-size: 23px;
  font-weight: 900;
  margin: 2px 0 5px;
}

.kugoo-subheading {
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 18px;
}

.kugoo-menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.kugoo-menu-tile {
  min-height: 112px;
  border: 1px solid var(--line);
  border-radius: 17px;
  background: var(--panel);
  color: var(--text);
  text-align: left;
  padding: 15px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 150ms ease, border-color 150ms ease;
}

.kugoo-menu-tile:active {
  transform: scale(.97);
}

.kugoo-menu-icon {
  font-size: 23px;
  color: var(--red);
}

.kugoo-menu-name {
  font-weight: 850;
  font-size: 14px;
}

.kugoo-menu-description {
  color: var(--muted);
  font-size: 10px;
  margin-top: 3px;
}

.kugoo-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 15px;
  margin-bottom: 10px;
}

.kugoo-card-title {
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 8px;
}

.kugoo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.kugoo-row:last-child {
  border-bottom: 0;
}

.kugoo-muted {
  color: var(--muted);
  font-size: 12px;
}

.kugoo-setting-button {
  background: var(--panel2);
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.kugoo-input {
  accent-color: var(--red);
}

.kugoo-empty {
  padding: 25px 10px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
}

.kugoo-message {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--panel2);
  color: var(--muted);
  font-size: 11px;
  margin-bottom: 10px;
}

@media (max-height: 500px) {
  .kugoo-topbar {
    height: 45px;
    min-height: 45px;
  }

  .kugoo-screen {
    padding: 9px 13px;
  }

  .kugoo-ride-screen {
    gap: 7px;
  }

  .kugoo-stat-card {
    padding: 7px 10px;
  }

  .kugoo-speed {
    font-size: clamp(52px, 12vw, 82px);
  }

  .kugoo-speed-card {
    padding: 7px;
  }

  .kugoo-menu-tile {
    min-height: 90px;
  }
}

@media (min-width: 700px) {
  .kugoo-ride-screen {
    max-width: 760px;
    margin: 0 auto;
  }

  .kugoo-menu-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
`;

function readRides(): Ride[] {
  try {
    const saved = localStorage.getItem("kugoo-rides");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRides(rides: Ride[]) {
  localStorage.setItem("kugoo-rides", JSON.stringify(rides));
}

export default function App() {
  const [page, setPage] = useState<Page>("ride");
  const [menuOpen, setMenuOpen] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("kugoo-theme") as Theme) || "dark";
  });

  const [units, setUnits] = useState<"kmh" | "mph">(() => {
    return (localStorage.getItem("kugoo-units") as "kmh" | "mph") || "kmh";
  });

  const [demoMode, setDemoMode] = useState(false);
  const [rideActive, setRideActive] = useState(false);
  const [rideSeconds, setRideSeconds] = useState(0);
  const [tripDistance, setTripDistance] = useState(0);

  const [telemetry, setTelemetry] =
    useState<Telemetry>(initialTelemetry);

  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");

  const [rides, setRides] = useState<Ride[]>(readRides);

  const rideStartRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("kugoo-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("kugoo-units", units);
  }, [units]);

  useEffect(() => {
    saveRides(rides);
  }, [rides]);

  useEffect(() => {
    if (!rideActive) return;

    const timer = window.setInterval(() => {
      setRideSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [rideActive]);

  useEffect(() => {
    if (!demoMode) {
      setTelemetry(initialTelemetry);
      return;
    }

    const timer = window.setInterval(() => {
      setTelemetry({
        speed: Math.floor(Math.random() * 25) + 5,
        battery: 75,
        voltage: 76.4,
        power: Math.floor(Math.random() * 1800) + 200,
        motorTemp: 42,
        controllerTemp: 38,
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [demoMode]);

  useEffect(() => {
    if (!device) return;

    const handleDisconnect = () => {
      setDevice(null);
      setMessage("Bluetooth device disconnected.");
    };

    device.addEventListener("gattserverdisconnected", handleDisconnect);

    return () => {
      device.removeEventListener(
        "gattserverdisconnected",
        handleDisconnect
      );
    };
  }, [device]);

  const connected = !!device?.gatt?.connected;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  const displayedSpeed =
    units === "kmh"
      ? telemetry.speed
      : telemetry.speed * 0.621371;

  const displayedDistance =
    units === "kmh"
      ? tripDistance
      : tripDistance * 0.621371;

  const startRide = () => {
    if (rideActive) return;

    setRideSeconds(0);
    setTripDistance(0);
    rideStartRef.current = Date.now();
    setRideActive(true);
    setMessage("Ride started.");
  };

  const stopRide = () => {
    if (!rideActive) return;

    setRideActive(false);

    const newRide: Ride = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      distance: tripDistance,
      duration: rideSeconds,
    };

    setRides((previous) => [newRide, ...previous]);
    setMessage("Ride saved locally.");
  };

  const connectBluetooth = async () => {
    if (!("bluetooth" in navigator)) {
      setMessage(
        "Web Bluetooth is not available in this browser. Try Chrome on Android."
      );
      return;
    }

    try {
      setConnecting(true);
      setMessage("Choose a Bluetooth device.");

      const selectedDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      });

      if (!selectedDevice.gatt) {
        setMessage("This device does not provide a GATT connection.");
        return;
      }

      await selectedDevice.gatt.connect();

      setDevice(selectedDevice);
      setMessage(
        "Connected. No verified telemetry protocol has been configured yet."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed.";

      setMessage(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectBluetooth = () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }

    setDevice(null);
    setMessage("Disconnected.");
  };

  const exportRides = () => {
    const data = JSON.stringify(rides, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "kugoo-rides.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const selectPage = (selectedPage: Page) => {
    setPage(selectedPage);
    setMenuOpen(false);
    setMessage("");
  };

  const currentPageName =
    pages.find((item) => item.id === page)?.name || "Ride";

  return (
    <div className={`kugoo-app ${theme}`}>
      <style>{appStyles}</style>

      <div className="kugoo-device">
        <header className="kugoo-topbar">
          <div className="kugoo-top-left">
            <button
              className="kugoo-menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open menu"
            >
              {menuOpen ? "×" : "☰"}
            </button>

            <div className="kugoo-logo">
              KUGOO<span>.</span>
            </div>
          </div>

          <div className="kugoo-status">
            <span
              className={`kugoo-dot ${connected ? "connected" : ""}`}
            />
            {connected ? "CONNECTED" : "NOT CONNECTED"}
          </div>
        </header>

        <main className="kugoo-content">
          {menuOpen ? (
            <section className="kugoo-screen kugoo-page-scroll">
              <div className="kugoo-heading">Menu</div>
              <div className="kugoo-subheading">
                KUGOO dashboard
              </div>

              <div className="kugoo-menu-grid">
                {pages.map((item) => (
                  <button
                    key={item.id}
                    className="kugoo-menu-tile"
                    onClick={() => selectPage(item.id)}
                  >
                    <div className="kugoo-menu-icon">
                      {item.icon}
                    </div>

                    <div>
                      <div className="kugoo-menu-name">
                        {item.name}
                      </div>
                      <div className="kugoo-menu-description">
                        {item.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <>
              {page === "ride" && (
                <section className="kugoo-screen kugoo-ride-screen">
                  <div className="kugoo-ride-actions">
                    {!rideActive ? (
                      <button
                        className="kugoo-primary-button"
                        onClick={startRide}
                      >
                        START RIDE
                      </button>
                    ) : (
                      <button
                        className="kugoo-primary-button"
                        onClick={stopRide}
                      >
                        STOP RIDE
                      </button>
                    )}

                    <button
                      className="kugoo-secondary-button"
                      onClick={() => setDemoMode(!demoMode)}
                    >
                      DEMO {demoMode ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div className="kugoo-speed-card">
                    <div className="kugoo-speed-label">
                      CURRENT SPEED
                    </div>

                    <div className="kugoo-speed">
                      {displayedSpeed.toFixed(0)}
                    </div>

                    <div className="kugoo-speed-unit">
                      {units === "kmh" ? "KM/H" : "MPH"}
                    </div>
                  </div>

                  <div className="kugoo-stats-grid">
                    <div className="kugoo-stat-card">
                      <div className="kugoo-stat-label">
                        Battery
                      </div>
                      <div className="kugoo-stat-value">
                        {telemetry.battery || "--"}
                        <span className="kugoo-stat-unit">%</span>
                      </div>
                    </div>

                    <div className="kugoo-stat-card">
                      <div className="kugoo-stat-label">
                        Power
                      </div>
                      <div className="kugoo-stat-value">
                        {telemetry.power || "--"}
                        <span className="kugoo-stat-unit">W</span>
                      </div>
                    </div>

                    <div className="kugoo-stat-card">
                      <div className="kugoo-stat-label">
                        Motor temp
                      </div>
                      <div className="kugoo-stat-value">
                        {telemetry.motorTemp ?? "--"}
                        <span className="kugoo-stat-unit">°C</span>
                      </div>
                    </div>

                    <div className="kugoo-stat-card">
                      <div className="kugoo-stat-label">
                        Trip distance
                      </div>
                      <div className="kugoo-stat-value">
                        {displayedDistance.toFixed(1)}
                        <span className="kugoo-stat-unit">
                          {units === "kmh" ? "KM" : "MI"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="kugoo-stat-card">
                    <div className="kugoo-row">
                      <span className="kugoo-stat-label">
                        RIDE TIME
                      </span>
                      <strong>{formatTime(rideSeconds)}</strong>
                    </div>
                  </div>

                  <div className="kugoo-notice">
                    {demoMode
                      ? "DEMO DATA — NOT REAL VEHICLE TELEMETRY"
                      : connected
                      ? "Bluetooth connected. Telemetry protocol not configured."
                      : "Connect a supported device to begin."}
                  </div>
                </section>
              )}

              {page === "statistics" && (
  <section className="kugoo-screen kugoo-page-scroll">
    <div className="kugoo-heading">Statistics</div>
    <div className="kugoo-subheading">
      Your locally saved rides
    </div>

    <div className="kugoo-card">
      <div className="kugoo-card-title">Ride records</div>

      <div className="kugoo-row">
        <span>Total rides</span>
        <strong>{rides.length}</strong>
      </div>

      <div className="kugoo-row">
        <span>Total distance</span>
        <strong>
          {rides.reduce((sum, ride) => sum + ride.distance, 0).toFixed(1)} km
        </strong>
      </div>

      <div className="kugoo-row">
        <span>Total ride time</span>
        <strong>
          {formatTime(rides.reduce((sum, ride) => sum + ride.duration, 0))}
        </strong>
      </div>
    </div>

    <div className="kugoo-card">
      <div className="kugoo-card-title">Ride history</div>

      {rides.length === 0 ? (
        <div className="kugoo-empty">No rides saved yet.</div>
      ) : (
        rides.map((ride) => (
          <div className="kugoo-row" key={ride.id}>
            <div>
              <strong>{ride.distance.toFixed(1)} km</strong>
              <div className="kugoo-muted">{ride.date}</div>
            </div>
            <span>{formatTime(ride.duration)}</span>
          </div>
        ))
      )}
    </div>

    <button className="kugoo-primary-button" onClick={exportRides}>
      EXPORT RIDE DATA
    </button>
  </section>
)}

{page === "battery" && (
  <section className="kugoo-screen kugoo-page-scroll">
    <div className="kugoo-heading">Battery</div>
    <div className="kugoo-subheading">Battery information</div>

    <div className="kugoo-card">
      <div className="kugoo-card-title">Battery status</div>
      <div className="kugoo-row">
        <span>Charge level</span>
        <strong>{telemetry.battery ? `${telemetry.battery}%` : "--"}</strong>
      </div>
      <div className="kugoo-row">
        <span>Voltage</span>
        <strong>{telemetry.voltage ? `${telemetry.voltage.toFixed(1)} V` : "--"}</strong>
      </div>
      <div className="kugoo-row">
        <span>Power</span>
        <strong>{telemetry.power ? `${telemetry.power} W` : "--"}</strong>
      </div>
    </div>

    <div className="kugoo-message">
      Battery readings require a verified telemetry protocol.
    </div>
  </section>
)}

{page === "diagnostics" && (
  <section className="kugoo-screen kugoo-page-scroll">
    <div className="kugoo-heading">Diagnostics</div>
    <div className="kugoo-subheading">System information</div>

    <div className="kugoo-card">
      <div className="kugoo-row">
        <span>Dashboard</span>
        <strong>Online</strong>
      </div>
      <div className="kugoo-row">
        <span>Bluetooth</span>
        <strong>{connected ? "Connected" : "Disconnected"}</strong>
      </div>
      <div className="kugoo-row">
        <span>Demo mode</span>
        <strong>{demoMode ? "Enabled" : "Disabled"}</strong>
      </div>
      <div className="kugoo-row">
        <span>Motor temperature</span>
        <strong>{telemetry.motorTemp ?? "Unavailable"}{telemetry.motorTemp !== null ? " °C" : ""}</strong>
      </div>
      <div className="kugoo-row">
        <span>Controller temperature</span>
        <strong>{telemetry.controllerTemp ?? "Unavailable"}{telemetry.controllerTemp !== null ? " °C" : ""}</strong>
      </div>
    </div>

    <div className="kugoo-message">
      Read-only connection handling. No controller or BMS commands are sent.
    </div>
  </section>
)}

{page === "bluetooth" && (
  <section className="kugoo-screen kugoo-page-scroll">
    <div className="kugoo-heading">Bluetooth</div>
    <div className="kugoo-subheading">Connect your vehicle devices</div>

    {message && <div className="kugoo-message">{message}</div>}

    <div className="kugoo-card">
      <div className="kugoo-card-title">FarDriver ND72450</div>
      <div className="kugoo-row">
        <span>Connection</span>
        <strong>{connected ? "Connected" : "Not connected"}</strong>
      </div>
      <div className="kugoo-row">
        <span>Device</span>
        <strong>{device?.name || "Not selected"}</strong>
      </div>

      {!connected ? (
        <button
          className="kugoo-primary-button"
          disabled={connecting}
          onClick={connectBluetooth}
        >
          {connecting ? "CONNECTING..." : "CONNECT DEVICE"}
        </button>
      ) : (
        <button className="kugoo-secondary-button" onClick={disconnectBluetooth}>
          DISCONNECT
        </button>
      )}
    </div>

    <div className="kugoo-card">
      <div className="kugoo-card-title">JBD BMS</div>
      <div className="kugoo-muted">
        Not connected. A verified JBD BLE protocol is required.
      </div>
    </div>
  </section>
)}

{page === "settings" && (
  <section className="kugoo-screen kugoo-page-scroll">
    <div className="kugoo-heading">Settings</div>
    <div className="kugoo-subheading">Customise your dashboard</div>

    <div className="kugoo-card">
      <div className="kugoo-row">
        <span>Appearance</span>
        <button
          className="kugoo-setting-button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "Dark" : "Light"}
        </button>
      </div>

      <div className="kugoo-row">
        <span>Speed units</span>
        <button
          className="kugoo-setting-button"
          onClick={() => setUnits(units === "kmh" ? "mph" : "kmh")}
        >
          {units === "kmh" ? "KM/H" : "MPH"}
        </button>
      </div>

      <div className="kugoo-row">
        <span>Demo mode</span>
        <button
          className="kugoo-setting-button"
          onClick={() => setDemoMode(!demoMode)}
        >
          {demoMode ? "ON" : "OFF"}
        </button>
      </div>
    </div>

    <div className="kugoo-card">
      <div className="kugoo-card-title">About</div>
      <div className="kugoo-row">
        <span>App</span>
        <strong>KUGOO Dashboard</strong>
      </div>
      <div className="kugoo-row">
        <span>Version</span>
        <strong>1.0.0</strong>
      </div>
      <div className="kugoo-row">
        <span>Storage</span>
        <strong>Local device</strong>
      </div>
    </div>
  </section>
)}
</>
)}
</main>
</div>
</div>
);
}
