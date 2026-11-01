/**
 * Enterprise Fleet Management & Predictive Maintenance Module
 * Features Canvas-based pressure decay charting, component replacement simulation,
 * and automated field service work-order generation.
 */

class FleetManagementModule {
  constructor() {
    this.skus = [
      { id: "ATMB-FLT-SED-05M", name: "5-Micron Spun Sediment Pre-Filter", lifePct: 92, status: "HEALTHY", estDaysRemaining: 180 },
      { id: "ATMB-FLT-ACB-G2", name: "High-Adsorption Activated Carbon Block", lifePct: 88, status: "HEALTHY", estDaysRemaining: 165 },
      { id: "ATMB-MEM-RO75-P3", name: "75 GPD Polyamide Thin-Film RO Membrane", lifePct: 94, status: "HEALTHY", estDaysRemaining: 340 },
      { id: "ATMB-CRT-MIN-AL4", name: "Alkaline & Electrolyte Mineraliser Cartridge", lifePct: 89, status: "HEALTHY", estDaysRemaining: 190 },
      { id: "ATMB-LED-UVC-254", name: "Quartz Sleeve Germicidal UV-C Photonic Chamber", lifePct: 99, status: "OPTIMAL", estDaysRemaining: 720 }
    ];

    this.rwaNodes = [
      { building: "Sunrise Heights Block A", units: 48, avgTDS: 112, avgTurbidity: 0.38, status: "COMPLIANT" },
      { building: "Sunrise Heights Block B", units: 48, avgTDS: 115, avgTurbidity: 0.42, status: "COMPLIANT" },
      { building: "Kaveri Residency Tower 1", units: 64, avgTDS: 108, avgTurbidity: 0.36, status: "COMPLIANT" },
      { building: "Prestige Lakeview Flat 204", units: 32, avgTDS: 122, avgTurbidity: 0.45, status: "COMPLIANT" },
      { building: "Dr. Nair Medical Annex", units: 12, avgTDS: 84, avgTurbidity: 0.28, status: "VERIFIED_SAFE_POINT" }
    ];

    // Historical Differential Pressure Curve Data (Cycles vs Delta P in PSI)
    this.pressureHistory = [
      { cycle: 0, deltaP: 18, flux: 1.9 },
      { cycle: 50, deltaP: 19, flux: 1.88 },
      { cycle: 100, deltaP: 21, flux: 1.85 },
      { cycle: 150, deltaP: 23, flux: 1.80 },
      { cycle: 200, deltaP: 27, flux: 1.72 },
      { cycle: 250, deltaP: 34, flux: 1.58 }, // Warning threshold
      { cycle: 280, deltaP: 38, flux: 1.45 }  // Trigger auto-flush
    ];
  }

  replaceComponent(skuId) {
    const item = this.skus.find(s => s.id === skuId);
    if (item) {
      item.lifePct = 100;
      item.status = "OPTIMAL";
      item.estDaysRemaining = item.id.includes('RO') ? 365 : 180;
      this.renderSkuTable('sku-table-body');
      
      if (window.hydraSimulation) {
        window.hydraSimulation.waterTwin.membraneHealth = 100;
        window.hydraSimulation.notify();
      }
      return item;
    }
  }

  generateWorkOrder(skuId) {
    const item = this.skus.find(s => s.id === skuId) || this.skus[0];
    const woNumber = "WO-ATMB-" + Math.floor(100000 + Math.random() * 900000);
    const date = new Date().toLocaleDateString('en-GB');

    return {
      workOrderNumber: woNumber,
      issuedDate: date,
      customerName: "Lakshmi Residence (Unit 304, HAL 2nd Stage)",
      pincode: "560038",
      assignedEngineer: "Suresh M. (Atomberg Authorized Field Technician #482)",
      partSku: item.id,
      partDescription: item.name,
      dispatchWindow: "Tomorrow, 10:00 AM - 12:30 PM",
      recyclingBarcode: `ATMB-REC-${woNumber.split('-')[2]}`
    };
  }

  renderSkuTable(tableBodyId = 'sku-table-body') {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    tbody.innerHTML = this.skus.map(s => `
      <tr>
        <td style="font-family:var(--font-mono); font-weight:700;">${s.id}</td>
        <td>${s.name}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="flex:1; height:6px; background:#E2E8F0; border-radius:999px; overflow:hidden;">
              <div style="width:${s.lifePct}%; height:100%; background:${s.lifePct > 80 ? '#059669' : '#D97706'};"></div>
            </div>
            <span style="font-weight:700; font-size:0.75rem; font-family:var(--font-mono);">${s.lifePct}%</span>
          </div>
        </td>
        <td>${s.estDaysRemaining} Days</td>
        <td>
          <button onclick="window.fleetManagement.replaceComponent('${s.id}')" style="background:#F1F5F9; border:1px solid #CBD5E1; font-size:0.72rem; font-weight:700; padding:3px 8px; border-radius:3px; cursor:pointer;">
            Replace Part
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderRwaTable(tableBodyId = 'rwa-table-body') {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    tbody.innerHTML = this.rwaNodes.map(r => `
      <tr>
        <td style="font-weight:700;">${r.building}</td>
        <td>${r.units} Units</td>
        <td style="font-family:var(--font-mono);">${r.avgTDS} ppm</td>
        <td style="font-family:var(--font-mono);">${r.avgTurbidity} NTU</td>
        <td>
          <span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:4px; ${
            r.status === 'VERIFIED_SAFE_POINT' ? 'background:#F0F9FF; color:#0284C7;' : 'background:#ECFDF5; color:#059669;'
          }">
            ${r.status === 'VERIFIED_SAFE_POINT' ? 'Verified Safe Point' : 'Compliant'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  // Draw Pressure Decay & Permeability Chart on HTML5 Canvas
  renderPressureDecayChart(canvasId = 'chart-pressure-decay') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background & Grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 30; y < h - 25; y += 35) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 15, y);
      ctx.stroke();
    }

    // Axes Labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px monospace';
    ctx.fillText('45 PSI', 5, 35);
    ctx.fillText('30 PSI', 5, 85);
    ctx.fillText('15 PSI', 5, 135);
    ctx.fillText('0 Cycles', 40, h - 8);
    ctx.fillText('150 Cycles', w / 2 - 25, h - 8);
    ctx.fillText('300 Cycles', w - 65, h - 8);

    // Threshold Line (35 PSI trigger)
    const thresholdY = 65;
    ctx.strokeStyle = '#DC2626';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, thresholdY);
    ctx.lineTo(w - 15, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#DC2626';
    ctx.fillText('Auto-Flush Trigger Threshold (35 PSI)', w - 210, thresholdY - 4);

    // Plot Pressure Curve (Delta P in Atomberg Yellow)
    ctx.strokeStyle = '#FFB800';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const maxCycle = 300;
    const minP = 10, maxP = 45;
    const plotX = (c) => 40 + (c / maxCycle) * (w - 60);
    const plotY = (p) => h - 25 - ((p - minP) / (maxP - minP)) * (h - 55);

    this.pressureHistory.forEach((pt, idx) => {
      const x = plotX(pt.cycle);
      const y = plotY(pt.deltaP);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Plot Points with tooltips
    this.pressureHistory.forEach((pt) => {
      const x = plotX(pt.cycle);
      const y = plotY(pt.deltaP);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

window.fleetManagement = new FleetManagementModule();
