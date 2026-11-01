/**
 * Hydra Grid Engine - Enterprise Specification
 * Decentralized neighborhood sensor network, federated spatial consensus,
 * interactive node inspection and localized fault injection.
 */

class HydraGridNetwork {
  constructor() {
    this.centerLat = 12.9719;
    this.centerLng = 77.6412;

    this.nodes = [
      { id: 'NODE-01', name: "Lakshmi Residence (Local Node)", lat: 12.9722, lng: 77.6415, status: 'NOMINAL', tds: 85, turbidity: 0.35, isSafePoint: false, reserveLitres: 7.2 },
      { id: 'NODE-02', name: "Sunrise Heights (Block B)", lat: 12.9731, lng: 77.6425, status: 'NOMINAL', tds: 90, turbidity: 0.40, isSafePoint: true, reserveLitres: 45.0 },
      { id: 'NODE-03', name: "Sunshine Enclave Unit 402", lat: 12.9715, lng: 77.6402, status: 'NOMINAL', tds: 88, turbidity: 0.32, isSafePoint: true, reserveLitres: 28.0 },
      { id: 'NODE-04', name: "Dr. Nair Medical Annex", lat: 12.9740, lng: 77.6408, status: 'NOMINAL', tds: 82, turbidity: 0.28, isSafePoint: true, reserveLitres: 60.0 },
      { id: 'NODE-05', name: "Indira Heights Apartment 3A", lat: 12.9708, lng: 77.6420, status: 'NOMINAL', tds: 92, turbidity: 0.38, isSafePoint: false, reserveLitres: 6.5 },
      { id: 'NODE-06', name: "Sai Krupa Villa", lat: 12.9698, lng: 77.6432, status: 'NOMINAL', tds: 95, turbidity: 0.42, isSafePoint: false, reserveLitres: 8.0 },
      { id: 'NODE-07', name: "Kaveri Residency (Block A)", lat: 12.9735, lng: 77.6445, status: 'NOMINAL', tds: 89, turbidity: 0.36, isSafePoint: true, reserveLitres: 50.0 },
      { id: 'NODE-08', name: "Prestige Ozone Flat 104", lat: 12.9750, lng: 77.6395, status: 'NOMINAL', tds: 94, turbidity: 0.33, isSafePoint: false, reserveLitres: 7.0 },
      { id: 'NODE-09', name: "RWA Community Utility Node", lat: 12.9725, lng: 77.6385, status: 'NOMINAL', tds: 78, turbidity: 0.25, isSafePoint: true, reserveLitres: 120.0 }
    ];

    this.map = null;
    this.markers = {};
    this.gridAlertActive = false;
    this.alertMessage = 'Sector Water Main Status: 9/9 reporting units within compliant municipal baseline.';
    this.consensusCount = 0;
    this.routingLine = null;

    if (window.hydraSimulation) {
      window.hydraSimulation.subscribe((state) => this.onLocalStateChange(state));
    }
  }

  initMap(containerId = 'hydra-map-canvas') {
    const el = document.getElementById(containerId);
    if (!el || typeof L === 'undefined' || this.map) return;

    this.map = L.map(containerId, {
      center: [this.centerLat, this.centerLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.renderMarkers();
  }

  renderMarkers() {
    if (!this.map) return;

    this.nodes.forEach(node => {
      const isUser = node.id === 'NODE-01';
      let iconColor = '#059669';
      let label = isUser ? 'YOU' : '';

      if (node.status === 'CONTAMINATED') {
        iconColor = '#DC2626';
        label = 'FAIL';
      } else if (node.isSafePoint && this.gridAlertActive) {
        iconColor = '#0284C7';
        label = 'SAFE';
      }

      const customHtml = `
        <div style="
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          background: ${iconColor}; 
          border: 2px solid #FFFFFF; 
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-family: sans-serif;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: -0.2px;
          cursor: pointer;
        ">
          ${label}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-grid-pin',
        html: customHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (this.markers[node.id]) {
        this.markers[node.id].setIcon(customIcon);
      } else {
        const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(this.map);
        marker.on('click', () => this.selectNode(node.id));
        this.markers[node.id] = marker;
      }
    });
  }

  selectNode(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const inspector = document.getElementById('grid-node-inspector');
    if (!inspector) return;

    inspector.style.display = 'block';
    inspector.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <strong style="font-size:0.88rem; color:#0F172A;">${node.name}</strong>
        <span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:3px; ${
          node.status === 'CONTAMINATED' ? 'background:#FEF2F2; color:#DC2626;' : 'background:#ECFDF5; color:#059669;'
        }">${node.status}</span>
      </div>
      <div style="font-size:0.78rem; color:#475569; display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px;">
        <div>TDS Reading: <strong style="font-family:var(--font-mono); color:#0F172A;">${node.tds} ppm</strong></div>
        <div>Optical Turbidity: <strong style="font-family:var(--font-mono); color:#0F172A;">${node.turbidity} NTU</strong></div>
        <div>Clean Storage: <strong style="font-family:var(--font-mono); color:#0F172A;">${node.reserveLitres} L</strong></div>
        <div>Safe Point: <strong style="color:${node.isSafePoint ? '#0284C7' : '#64748B'};">${node.isSafePoint ? 'Verified Yes' : 'No'}</strong></div>
      </div>
      <div style="display:flex; gap:8px;">
        <button onclick="window.hydraGrid.injectLocalFault('${node.id}')" style="background:#DC2626; color:#FFF; border:none; font-size:0.75rem; font-weight:700; padding:6px 12px; border-radius:4px; cursor:pointer;">
          Inject Pipe Fault on this Node
        </button>
        <button onclick="document.getElementById('grid-node-inspector').style.display='none'" style="background:#E2E8F0; border:none; font-size:0.75rem; font-weight:700; padding:6px 12px; border-radius:4px; cursor:pointer;">
          Close
        </button>
      </div>
    `;
  }

  injectLocalFault(nodeId) {
    const target = this.nodes.find(n => n.id === nodeId);
    if (!target) return;

    target.status = 'CONTAMINATED';
    target.turbidity = 19.5;
    target.tds = 260;

    // Trigger local simulation if it's user node
    if (nodeId === 'NODE-01' && window.hydraSimulation) {
      window.hydraSimulation.injectScenario('PIPE_BURST');
    } else {
      // Cross validate consensus on nearby nodes
      this.nodes[0].status = 'CONTAMINATED';
      this.nodes[1].status = 'CONTAMINATED';
      this.consensusCount = 3;
      this.gridAlertActive = true;
      this.alertMessage = `CIVIC INCIDENT ALERT: Localized pipe mud incursion detected at ${target.name}. Spatial consensus established across 3 sector nodes. Safe Points active.`;
      
      if (window.hydraSimulation) {
        window.hydraSimulation.injectScenario('PIPE_BURST');
      }
      this.highlightSafePoints();
    }

    this.renderMarkers();
    this.updateGridAlertUI();
    this.selectNode(nodeId);
  }

  onLocalStateChange(localState) {
    const userNode = this.nodes[0];
    userNode.turbidity = localState.sensors.turbidity;
    userNode.tds = localState.sensors.outletTDS;

    if (!localState.actuators.solenoidInterlock && localState.sensors.turbidity > 2.0) {
      userNode.status = 'CONTAMINATED';
      this.nodes[1].status = 'CONTAMINATED';
      this.nodes[1].turbidity = Number((localState.sensors.turbidity * 0.9).toFixed(1));
      this.nodes[4].status = 'CONTAMINATED';
      this.nodes[4].turbidity = Number((localState.sensors.turbidity * 1.1).toFixed(1));

      this.consensusCount = 3;
      this.gridAlertActive = true;
      this.alertMessage = 'CIVIC INCIDENT ALERT (PIN 560038): 3 connected nodes on 12th Main cross-validate particulate breakthrough. Sector safety interlocks clamped. Safe Points activated.';
      this.highlightSafePoints();
    } else {
      userNode.status = 'NOMINAL';
      this.nodes[1].status = 'NOMINAL';
      this.nodes[4].status = 'NOMINAL';
      this.consensusCount = 0;
      this.gridAlertActive = false;
      this.alertMessage = 'Sector Water Main Status: 9/9 reporting units within compliant municipal baseline.';

      if (this.routingLine && this.map) {
        this.map.removeLayer(this.routingLine);
        this.routingLine = null;
      }
    }

    this.renderMarkers();
    this.updateGridAlertUI();
  }

  highlightSafePoints() {
    const safeNodes = this.nodes.filter(n => n.isSafePoint && n.status === 'NOMINAL');
    if (safeNodes.length > 0 && this.map) {
      const nearest = safeNodes[0];
      if (this.routingLine) this.map.removeLayer(this.routingLine);

      this.routingLine = L.polyline([
        [this.nodes[0].lat, this.nodes[0].lng],
        [nearest.lat, nearest.lng]
      ], {
        color: '#0284C7',
        dashArray: '6, 6',
        weight: 3,
        opacity: 0.9
      }).addTo(this.map);
    }
  }

  updateGridAlertUI() {
    const alertBanner = document.getElementById('grid-status-alert');
    if (alertBanner) {
      alertBanner.textContent = this.alertMessage;
      if (this.gridAlertActive) {
        alertBanner.style.background = '#FEF2F2';
        alertBanner.style.borderColor = '#FECACA';
        alertBanner.style.color = '#DC2626';
      } else {
        alertBanner.style.background = '#F0F9FF';
        alertBanner.style.borderColor = '#BAE6FD';
        alertBanner.style.color = '#0284C7';
      }
    }

    const safePointsCountEl = document.getElementById('grid-safe-points-count');
    if (safePointsCountEl) {
      safePointsCountEl.textContent = this.gridAlertActive ? '3 Active' : '3 Ready';
    }
  }
}

window.hydraGrid = new HydraGridNetwork();
