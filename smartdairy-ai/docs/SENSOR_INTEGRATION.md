# SmartDairy AI Hardware Sensor Integration Guide

## 1. Physical Sensor Instrumentation

The SmartDairy AI sensing line mounts three inline hygienic instruments and an entrance RFID transceiver:

```
Teat Cluster -> [RFID Transceiver] -> [SomaDetect] -> [ifm Foodmag] -> [Mettler Toledo InPro] -> Milk Receiver
```

### 1.1 SomaDetect Optical Milk Analyzer
- **Technology**: Optical light scatter and deep neural network spectral analysis.
- **Measurements**: Somatic Cell Count (SCC k cells/mL), milk fat %, protein %.
- **Hygienic Rating**: 3-A Sanitary Standards, flow-through optical chamber.
- **Data Interface**: REST Edge API / Ethernet TCP.

### 1.2 ifm SM Foodmag (SM6000 Series)
- **Technology**: Electromagnetic-inductive flow meter with PEEK lining.
- **Measurements**: Instant flow rate (L/min), cumulative volume (L), media temperature (°C), electrical conductivity (mS/cm).
- **Hygienic Rating**: EHEDG, FDA compliant, CIP/SIP resilient.
- **Data Interface**: IO-Link Master over Industrial Ethernet / Modbus TCP.

### 1.3 Mettler Toledo InPro X1 HLS
- **Technology**: ISFET (Ion-Sensitive Field-Effect Transistor) solid-state pH sensor (glass-free).
- **Measurements**: Real-time pH, sensor diagnostic health, reference impedance.
- **Hygienic Rating**: 3-A, EHEDG certified for food contact.
- **Data Interface**: RS-485 Modbus RTU / 4-20 mA with HART.

### 1.4 Allflex / Dairymaster ISO 11784/11785 RFID Reader
- **Technology**: HDX / FDX-B RFID antenna transceiver at stall gate.
- **Measurements**: Electronic animal tag UID, reader status, RSSI signal strength.
- **Data Interface**: RS-232 / Wiegand / Industrial Ethernet.

---

## 2. Sensor Abstraction Layer

All sensor drivers implement interfaces in `@smartdairy/sensors`:

```typescript
export interface IRFIDReader {
  scanTag(tagUid?: string): Promise<RfidReadResult>;
  getStatus(): SensorStatus;
}

export interface ISCCSensor {
  readSCC(profile?: CowMilkingProfile, elapsedSeconds?: number): Promise<SCCReadingResult>;
  getStatus(): SensorStatus;
}

export interface IFlowSensor {
  readFlow(elapsedSeconds: number, previousVolume: number, profile?: CowMilkingProfile): Promise<FlowReadingResult>;
  getStatus(): SensorStatus;
}

export interface IPHSensor {
  readPH(profile?: CowMilkingProfile, elapsedSeconds?: number): Promise<PHReadingResult>;
  getStatus(): SensorStatus;
}
```

---

## 3. Transitioning from Simulation to Physical Hardware

Switching from simulated hardware to real physical instrumentation requires only changing the configuration variable:

```bash
# In .env:
SENSOR_MODE="REAL_VENDOR_API"
SOMADETECT_API_URL="https://192.168.1.100/api/v1"
SOMADETECT_API_KEY="edge-station-key"
FOODMAG_EDGE_HOST="192.168.1.105"
METTLER_TRANSMITTER_HOST="192.168.1.106"
```

No architectural refactoring or database migrations are required!
