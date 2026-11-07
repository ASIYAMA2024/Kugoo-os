import { useEffect, useRef, useState } from 'react'
import type { ReactNode, TouchEvent } from 'react'
import {
  Activity, Battery, Bluetooth, ChartNoAxesCombined, CircleAlert, Clock3,
  Gauge, History, Home, Maximize, Settings, Thermometer, WifiOff, Zap,
  Download, Play, Square, Bike, ShieldCheck, Radio
} from 'lucide-react'
import { discoverDevice, disconnectDevice, type DeviceConnection, type DeviceSlot } from './bluetooth'
import { getRides, saveRide, type Ride } from './db'

type Page = 'ride' | 'statistics' | 'battery' | 'diagnostics' | 'bluetooth' | 'settings'
type Theme = 'red' | 'amber' | 'ice' | 'green'
const pages: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'ride', label: 'Ride', icon: Gauge },
  { id: 'statistics', label: 'Statistics', icon: ChartNoAxesCombined },
  { id: 'battery', label: 'Battery', icon: Battery },
  { id: 'diagnostics', label: 'Diagnostics', icon: ShieldCheck },
  { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
  { id: 'settings', label: 'Settings', icon: Settings }
]
type WakeLockLike = { release: () => Promise<void> }\nconst demo = { speed: 0, battery: 76, voltage: 78.4, current: 0, power: 0, motorTemp: 31, controllerTemp: 29, trip: 0, rideSeconds: 0 }

export default function App() {
  const [page, setPage] = useState<Page>('ride')
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('kugoo-theme') as Theme) || 'red')
  const [units, setUnits] = useState<'kmh' | 'mph'>(() => (localStorage.getItem('kugoo-units') as 'kmh' | 'mph') || 'kmh')
  const [demoMode, setDemoMode] = useState(false)
  const [rideActive, setRideActive] = useState(false)
  const [rideStart, setRideStart] = useState<number | null>(null)
  const [rideSeconds, setRideSeconds] = useState(0)
  const [telemetry, setTelemetry] = useState(demo)
  const [connections, setConnections] = useState<Partial<Record<DeviceSlot, DeviceConnection>>>({})
  const [busy, setBusy] = useState<DeviceSlot | null>(null)
  const [message, setMessage] = useState('Bluetooth protocol not configured — no live readings available.')
  const [rides, setRides] = useState<Ride[]>([])
  const [wakeSupported, setWakeSupported] = useState(false)
  const wakeRef = useRef<WakeLockLike | null>(null)
  const touchStart = useRef<number | null>(null)

  useEffect(() => { getRides().then(setRides).catch(() => setMessage('Local ride database could not be opened.')) }, [])
  useEffect(() => { localStorage.setItem('kugoo-theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('kugoo-units', units) }, [units])
  useEffect(() => {
    if (!demoMode || !rideActive) return
    const timer = window.setInterval(() => {
      setTelemetry(t => ({ ...t, speed: 24 + Math.round(Math.random() * 8), current: 8 + Math.random() * 4, power: 650 + Math.round(Math.random() * 300), trip: t.trip + 0.001 }))
      setRideSeconds(s => s + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [demoMode, rideActive])
  useEffect(() => {
    if (!rideActive || demoMode) return
    const timer = window.setInterval(() => setRideSeconds(s => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [rideActive, demoMode])
  useEffect(() => {
    setWakeSupported('wakeLock' in navigator)
    return () => { wakeRef.current?.release().catch(() => undefined) }
  }, [])

  const activeIndex = pages.findIndex(p => p.id === page)
  const speed = units === 'kmh' ? telemetry.speed : telemetry.speed * 0.621371
  const speedLabel = units === 'kmh' ? 'km/h' : 'mph'
  const connectedCount = Object.values(connections).filter(Boolean).length
  const hasLiveTelemetry = false // Until a verified protocol adapter is implemented.
  const statusText = hasLiveTelemetry ? 'LIVE DATA' : demoMode ? 'DEMO DATA' : 'NO LIVE DATA'

  async function connect(slot: DeviceSlot) {
    setBusy(slot); setMessage(`Choose the ${slot === 'fardriver' ? 'FarDriver' : 'JBD'} device in the browser picker.`)
    try {
      const connection = await discoverDevice(slot)
      setConnections(prev => {
        const old = prev[slot]
        if (old) disconnectDevice(old)
        return { ...prev, [slot]: connection }
      })
      setMessage(`${connection.name} connected at GATT level. Telemetry protocol is not configured.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Bluetooth connection failed.')
    } finally { setBusy(null) }
  }
  function disconnect(slot: DeviceSlot) {
    disconnectDevice(connections[slot])
    setConnections(prev => { const next = { ...prev }; delete next[slot]; return next })
    setMessage(`${slot === 'fardriver' ? 'FarDriver' : 'JBD'} disconnected.`)
  }
  async function toggleWakeLock() {
    try {
      if (wakeRef.current) { await wakeRef.current.release(); wakeRef.current = null }
      else if ('wakeLock' in navigator) wakeRef.current = await (navigator as Navigator & { wakeLock: { request: (type: 'screen') => Promise<WakeLockLike> } }).wakeLock.request('screen')
    } catch { setMessage('Screen wake lock was denied or is unavailable.') }
  }
  async function startRide() {
    setRideStart(Date.now()); setRideSeconds(0); setRideActive(true)
    if (demoMode) setTelemetry(t => ({ ...t, trip: 0, speed: 0, current: 0, power: 0 }))
  }
  async function stopRide() {
    setRideActive(false)
    const ended = Date.now()
    if (rideStart) {
      const ride: Ride = {
        id: crypto.randomUUID(), startedAt: rideStart, endedAt: ended, durationSeconds: rideSeconds,
        distanceKm: demoMode ? Number(telemetry.trip.toFixed(3)) : null,
        maxSpeedKmh: demoMode ? telemetry.speed : null,
        averageSpeedKmh: null, energyWh: null, source: demoMode ? 'demo' : 'verified'
      }
      await saveRide(ride); setRides(await getRides())
    }
    setRideStart(null)
  }
  function exportData(format: 'json' | 'csv') {
    const content = format === 'json'
      ? JSON.stringify(rides, null, 2)
      : ['id,startedAt,endedAt,durationSeconds,distanceKm,maxSpeedKmh,averageSpeedKmh,energyWh,source', ...rides.map(r => [r.id,r.startedAt,r.endedAt,r.durationSeconds,r.distanceKm ?? '',r.maxSpeedKmh ?? '',r.averageSpeedKmh ?? '',r.energyWh ?? '',r.source].join(','))].join('\n')
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `kugoo-rides.${format}`; a.click(); URL.revokeObjectURL(url)
  }
  function changePage(next: Page) { setPage(next) }
  function onTouchStart(e: TouchEvent) { touchStart.current = e.changedTouches[0].clientX }
  function onTouchEnd(e: TouchEvent) {
    if (touchStart.current === null) return
    const delta = e.changedTouches[0].clientX - touchStart.current
    if (Math.abs(delta) > 90) setPage(pages[Math.max(0, Math.min(pages.length - 1, activeIndex + (delta < 0 ? 1 : -1)))].id)
    touchStart.current = null
  }
  const duration = `${String(Math.floor(rideSeconds / 3600)).padStart(2,'0')}:${String(Math.floor((rideSeconds % 3600)/60)).padStart(2,'0')}:${String(rideSeconds % 60).padStart(2,'0')}`

  return <div className={`app theme-${theme}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <header className="topbar">
      <div className="brand"><div className="brand-mark">K</div><div><div className="brand-name">KUGOO<span>.</span></div><div className="brand-sub">ELECTRIC PERFORMANCE</div></div></div>
      <div className="top-status"><span className={`status-dot ${connectedCount ? 'on' : ''}`} />{connectedCount ? `${connectedCount} DEVICE${connectedCount > 1 ? 'S' : ''} CONNECTED` : 'DEVICES DISCONNECTED'}<span className="top-divider" />{statusText}</div>
      <button className="icon-button" title="Toggle full screen" onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()}><Maximize size={18}/></button>
    </header>

    <div className="shell">
      <nav className="sidebar">
        {pages.map(({id,label,icon:Icon}) => <button key={id} className={`nav-item ${page===id?'selected':''}`} onClick={() => changePage(id)}><Icon size={19}/><span>{label}</span></button>)}
        <div className="side-bottom"><div className="side-bike"><Bike size={18}/><span>WISH 01</span></div><span className="version">BUILD 1.0.0</span></div>
      </nav>

      <main className="content">
        <div className="page-heading"><div><div className="eyebrow">KUGOO / {page.toUpperCase()}</div><h1>{pages.find(p=>p.id===page)?.label}</h1></div><div className="heading-right"><span className={`data-pill ${demoMode?'demo':'offline'}`}><i/>{statusText}</span><span className="date-label">{new Date().toLocaleDateString(undefined,{weekday:'short',day:'2-digit',month:'short'})}</span></div></div>

        {page === 'ride' && <section className="ride-grid">
          <div className="speed-card panel"><div className="card-kicker"><Gauge size={16}/> CURRENT SPEED <span className="live-tag">{demoMode?'SIMULATED':'WAITING'}</span></div><div className="speed-value">{demoMode ? speed.toFixed(0) : '—'}<small>{speedLabel}</small></div><div className="speed-foot"><span>MAX SPEED</span><b>{demoMode ? `${speed.toFixed(0)} ${speedLabel}` : '—'}</b></div><div className="speed-track"><span style={{width: `${demoMode ? Math.min(100, speed / 80 * 100) : 0}%`}}/></div></div>
          <div className="metric-card panel"><div className="metric-label"><Battery size={16}/> BATTERY</div><div className="metric-value">{demoMode?`${telemetry.battery}%`:'—'}</div><div className="metric-sub">{demoMode?`${telemetry.voltage.toFixed(1)} V`:'No BMS data'}</div><div className="meter"><span style={{width:demoMode?`${telemetry.battery}%`:'0%'}}/></div></div>
          <div className="metric-card panel"><div className="metric-label"><Zap size={16}/> POWER</div><div className="metric-value">{demoMode?telemetry.power:'—'}<small> W</small></div><div className="metric-sub">{demoMode?`${telemetry.current.toFixed(1)} A`:'No controller data'}</div></div>
          <div className="metric-card panel"><div className="metric-label"><Thermometer size={16}/> MOTOR TEMP</div><div className="metric-value">{demoMode?telemetry.motorTemp:'—'}<small>°C</small></div><div className="metric-sub">Controller: {demoMode?`${telemetry.controllerTemp}°C`:'—'}</div></div>
          <div className="metric-card panel"><div className="metric-label"><Activity size={16}/> TRIP DISTANCE</div><div className="metric-value">{demoMode?telemetry.trip.toFixed(2):'—'}<small> km</small></div><div className="metric-sub">Since ride start</div></div>
          <div className="metric-card panel"><div className="metric-label"><Clock3 size={16}/> RIDE TIME</div><div className="metric-value compact">{duration}</div><div className="metric-sub">{rideActive?'Ride recording':'Not recording'}</div></div>
          <div className="ride-actions panel"><div><div className="card-kicker">RIDE SESSION</div><div className="action-note">{rideActive?'Session in progress':'Start a session to record locally'}</div></div><div className="action-buttons">{!rideActive?<button className="primary-button" onClick={startRide}><Play size={16} fill="currentColor"/> START RIDE</button>:<button className="stop-button" onClick={stopRide}><Square size={15} fill="currentColor"/> STOP & SAVE</button>}</div></div>
          <div className="notice panel"><CircleAlert size={18}/><div><b>Telemetry is not connected</b><span>Values show dashes until a verified device protocol is integrated. Demo mode is separate and clearly labelled.</span></div></div>
        </section>}

        {page === 'statistics' && <section className="stack">
          <div className="stat-cards"><Stat label="TOTAL RIDES" value={String(rides.length)} icon={<History/>}/><Stat label="RECORDED DISTANCE" value={`${rides.reduce((s,r)=>s+(r.distanceKm||0),0).toFixed(2)} km`} icon={<Activity/>}/><Stat label="RIDE TIME" value={`${Math.round(rides.reduce((s,r)=>s+r.durationSeconds,0)/60)} min`} icon={<Clock3/>}/></div>
          <div className="panel table-panel"><div className="panel-title">RIDE HISTORY <span>{rides.length} SESSIONS</span></div>{rides.length===0?<Empty>No rides saved yet. Start a session on the Ride page.</Empty>:<div className="table-wrap"><table><thead><tr><th>DATE</th><th>DURATION</th><th>DISTANCE</th><th>MAX SPEED</th><th>SOURCE</th></tr></thead><tbody>{[...rides].reverse().map(r=><tr key={r.id}><td>{new Date(r.startedAt).toLocaleString()}</td><td>{Math.round(r.durationSeconds/60)} min</td><td>{r.distanceKm===null?'—':`${r.distanceKm} km`}</td><td>{r.maxSpeedKmh===null?'—':`${r.maxSpeedKmh} km/h`}</td><td><span className="source-tag">{r.source}</span></td></tr>)}</tbody></table></div>}</div>
          <div className="export-row"><button className="secondary-button" onClick={()=>exportData('csv')}><Download size={16}/> EXPORT CSV</button><button className="secondary-button" onClick={()=>exportData('json')}><Download size={16}/> EXPORT JSON</button></div>
        </section>}

        {page === 'battery' && <section className="battery-layout">
          <div className="panel battery-main"><div className="card-kicker"><Battery size={16}/> BATTERY STATUS</div><div className="battery-big">{demoMode?`${telemetry.battery}%`:'—'}</div><div className="muted">{demoMode?'DEMO VALUE':'WAITING FOR VERIFIED JBD DATA'}</div><div className="battery-bar"><span style={{width:demoMode?`${telemetry.battery}%`:'0%'}}/></div><div className="battery-spec"><span>PACK VOLTAGE<b>{demoMode?`${telemetry.voltage} V`:'—'}</b></span><span>CURRENT<b>{demoMode?`${telemetry.current.toFixed(1)} A`:'—'}</b></span><span>TEMPERATURE<b>—</b></span></div></div>
          <div className="panel cell-panel"><div className="panel-title">CELL INFORMATION <span>JBD BMS</span></div><Empty>Cell voltages, balance status and battery temperature will appear here after the JBD protocol and data scaling are verified. No cell values are fabricated.</Empty></div>
        </section>}

        {page === 'diagnostics' && <section className="stack">
          <div className="panel diagnostics"><div className="panel-title">SYSTEM STATUS</div><Diagnostic name="FarDriver ND72450" detail={connections.fardriver?.name || 'Not connected'} state={connections.fardriver?'GATT CONNECTED':'DISCONNECTED'} ok={!!connections.fardriver}/><Diagnostic name="JBD DB24SA05L24S100A" detail={connections.jbd?.name || 'Not connected'} state={connections.jbd?'GATT CONNECTED':'DISCONNECTED'} ok={!!connections.jbd}/><Diagnostic name="FarDriver telemetry" detail="Protocol not verified / not implemented" state="UNAVAILABLE" ok={false}/><Diagnostic name="JBD battery telemetry" detail="Protocol not verified / not implemented" state="UNAVAILABLE" ok={false}/><Diagnostic name="Ride storage" detail="Local IndexedDB" state="READY" ok={true}/><Diagnostic name="Offline app shell" detail="Provided by PWA service worker after first load" state="BUILD CONFIGURED" ok={true}/></div>
          <div className="notice panel"><ShieldCheck size={18}/><div><b>Read-only design</b><span>This app does not send controller tuning, motor-control or BMS configuration commands.</span></div></div>
        </section>}

        {page === 'bluetooth' && <section className="stack">
          <div className="bluetooth-grid"><DeviceCard title="FARDRIVER ND72450" subtitle="Controller Bluetooth module" icon={<Radio/>} connection={connections.fardriver} busy={busy==='fardriver'} onConnect={()=>connect('fardriver')} onDisconnect={()=>disconnect('fardriver')}/><DeviceCard title="JBD BMS" subtitle="DB24SA05L24S100A" icon={<Battery/>} connection={connections.jbd} busy={busy==='jbd'} onConnect={()=>connect('jbd')} onDisconnect={()=>disconnect('jbd')}/></div>
          <div className="notice panel"><CircleAlert size={18}/><div><b>Connection is not telemetry</b><span>Pairing here discovers a BLE device and opens its GATT connection only. No characteristic UUIDs, packet formats or scaling factors are assumed, and no data is read or written.</span></div></div>
          <div className="panel message-panel"><div className="panel-title">CONNECTION LOG</div><p>{message}</p><button className="text-button" onClick={()=>setMessage('Ready. Select a device to begin BLE discovery.')}>CLEAR LOG</button></div>
        </section>}

        {page === 'settings' && <section className="stack settings-grid">
          <div className="panel setting-panel"><div className="panel-title">APPEARANCE</div><div className="setting-row"><div><b>Accent colour</b><span>Dashboard highlight colour</span></div><div className="theme-options">{(['red','amber','ice','green'] as Theme[]).map(t=><button key={t} aria-label={`${t} theme`} className={`swatch ${t} ${theme===t?'active':''}`} onClick={()=>setTheme(t)}/>)}</div></div><div className="setting-row"><div><b>Speed units</b><span>Choose your preferred unit</span></div><div className="segmented"><button className={units==='kmh'?'active':''} onClick={()=>setUnits('kmh')}>KM/H</button><button className={units==='mph'?'active':''} onClick={()=>setUnits('mph')}>MPH</button></div></div></div>
          <div className="panel setting-panel"><div className="panel-title">RIDE DISPLAY</div><div className="setting-row"><div><b>Demo telemetry</b><span>Simulated values only — never real bike data</span></div><button className={`toggle ${demoMode?'enabled':''}`} onClick={()=>{setDemoMode(v=>!v);setTelemetry(demo)}}><i/></button></div><div className="setting-row"><div><b>Keep screen awake</b><span>{wakeSupported?'Use browser screen wake lock':'Not supported in this browser'}</span></div><button className={`toggle ${!!wakeRef.current?'enabled':''}`} onClick={toggleWakeLock} disabled={!wakeSupported}><i/></button></div><div className="setting-row"><div><b>Full screen</b><span>Hide browser controls where supported</span></div><button className="secondary-button small" onClick={()=>document.documentElement.requestFullscreen?.()}><Maximize size={14}/> ENABLE</button></div></div>
          <div className="panel setting-panel"><div className="panel-title">LOCAL DATA</div><div className="setting-row"><div><b>Export ride history</b><span>Download data stored on this device</span></div><div className="inline-buttons"><button className="secondary-button small" onClick={()=>exportData('csv')}>CSV</button><button className="secondary-button small" onClick={()=>exportData('json')}>JSON</button></div></div><div className="privacy-note"><ShieldCheck size={15}/> No account, cloud sync, analytics or advertising. Ride data stays in this browser's local storage.</div></div>
          <div className="panel setting-panel"><div className="panel-title">ALERT THRESHOLDS</div><Empty>Threshold controls will be enabled when verified telemetry sources and manufacturer-approved limits are available. No safety limits are guessed.</Empty></div>
        </section>}
        <footer className="footer"><span>KUGOO DASHBOARD <b>·</b> READ-ONLY MONITORING</span><span>LOCAL DATA ONLY</span></footer>
      </main>
    </div>
  </div>
}

function Stat({label,value,icon}:{label:string;value:string;icon:ReactNode}) { return <div className="panel stat-card"><div className="metric-label">{icon}{label}</div><div className="stat-value">{value}</div></div> }
function Empty({children}:{children:ReactNode}) { return <div className="empty-state">{children}</div> }
function Diagnostic({name,detail,state,ok}:{name:string;detail:string;state:string;ok:boolean}) { return <div className="diagnostic-row"><div><b>{name}</b><span>{detail}</span></div><span className={`diag-state ${ok?'good':'bad'}`}><i/>{state}</span></div> }
function DeviceCard({title,subtitle,icon,connection,busy,onConnect,onDisconnect}:{title:string;subtitle:string;icon:ReactNode;connection?:DeviceConnection;busy:boolean;onConnect:()=>void;onDisconnect:()=>void}) {
  return <div className="panel device-card"><div className="device-icon">{icon}</div><div className="device-title">{title}</div><div className="muted">{subtitle}</div><div className={`device-status ${connection?'connected':''}`}><i/>{connection?`CONNECTED · ${connection.name}`:'NOT CONNECTED'}</div>{connection?<button className="secondary-button full" onClick={onDisconnect}><WifiOff size={15}/> DISCONNECT</button>:<button className="primary-button full" disabled={busy} onClick={onConnect}><Bluetooth size={15}/>{busy?' SEARCHING…':' CONNECT DEVICE'}</button>}</div>
}
