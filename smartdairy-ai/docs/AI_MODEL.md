# SmartDairy AI Risk Engine & Machine Learning Architecture

## 1. Clinical Principles & Rationale

Mastitis (inflammation of the mammary gland) is the most costly disease in commercial dairy farming. Early detection before visual clinical signs appear allows targeted hygiene interventions and prevents herd-wide transmission.

SmartDairy AI evaluates multiple physiological markers continuously captured by inline sensors:

1. **Somatic Cell Count (SCC)**: Leucocyte influx into milk in response to bacterial infection. Normal: < 150 k/mL; Subclinical: 200–400 k/mL; Clinical: > 500 k/mL.
2. **Electrical Conductivity (EC)**: Mastitis damages tight epithelial junctions between alveoli, causing extracellular sodium ($Na^+$) and chloride ($Cl^-$) ions to enter milk, elevating conductivity ($> 6.5 \text{ mS/cm}$).
3. **Milk Yield Drop**: Inflamed udder tissue reduces synthesis; yield drops by 10%–30% vs cow personal moving baseline.
4. **Milk pH**: Normal fresh milk is slightly acidic ($\text{pH } 6.5 - 6.7$). Inflamed milk moves toward blood plasma pH ($\text{pH } 7.0 - 7.3$).
5. **Milk Line Temperature**: Localized inflammation and fever elevate milk temperature above 38.9 °C.

---

## 2. Multi-Feature Weighted Risk Model

The prototype implements `RuleBasedRiskModel` via the `IRiskModel` interface with configurable weights:

$$\text{Risk Score} = \sum_{i=1}^n w_i \times S_i$$

### Default Configuration Weights:
- **SCC Trend Weight**: $30\%$ ($0.30$)
- **Milk Yield Drop Weight**: $20\%$ ($0.20$)
- **Electrical Conductivity Shift**: $20\%$ ($0.20$)
- **pH Deviation Weight**: $10\%$ ($0.10$)
- **Flow Pattern Dynamics**: $10\%$ ($0.10$)
- **Milk Line Temperature**: $5\%$ ($0.05$)
- **Historical Risk Momentum**: $5\%$ ($0.05$)

All weights are fully configurable via REST API (`POST /api/ai/weights`) and the Settings UI page.

---

## 3. Prototype Risk Categories

- **0 – 29: LOW RISK** (Healthy, milk parameters aligned with personal baseline)
- **30 – 59: MODERATE RISK** (Subtle parameter drift, continued observation recommended)
- **60 – 79: HIGH RISK** (Multiple indicators exceeding thresholds, early-warning alert dispatched)
- **80 – 100: VERY HIGH RISK** (Critical alert generated, immediate veterinary inspection recommended)

> **Mandatory Regulatory Disclaimer**:
> *"Prototype AI risk estimate — not a veterinary diagnosis."*

---

## 4. Explainable AI (XAI) Output

Every inference produces human-interpretable natural language justifications and exact percentage factor contributions:

```json
{
  "riskScore": 76,
  "riskLevel": "HIGH",
  "confidence": 0.94,
  "factors": [
    { "factorName": "SCC_TREND", "deviationPercent": 38.5, "contribution": 24.3, "direction": "INCREASE" },
    { "factorName": "MILK_YIELD_DROP", "deviationPercent": -16.2, "contribution": 16.5, "direction": "DECREASE" },
    { "factorName": "CONDUCTIVITY_CHANGE", "deviationPercent": 14.1, "contribution": 15.2, "direction": "INCREASE" }
  ],
  "explanation": "Elevated risk detected. Contributing factors: SCC shifted +38.5% from baseline (540 vs 390 k/mL), Milk yield decreased by 16.2%, Milk conductivity elevated by 14.1% (6.85 mS/cm). Prototype AI risk estimate — not a veterinary diagnosis."
}
```

---

## 5. Machine Learning Extensibility

The system implements the `IRiskModel` interface:

```typescript
export interface IRiskModel {
  name: string;
  calculateRisk(features: CowFeatures): RiskAssessmentResult;
  updateWeights?(weights: Partial<RiskWeights>): void;
}
```

This enables seamless drop-in integration of trained `RandomForestRiskModel`, `XGBoostRiskModel`, or PyTorch ONNX models without modifying backend session lifecycle code.
