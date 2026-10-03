/**
 * Smart Mandi Price Advisor - Main Application
 */

const AppState = {
  commodities: [],
  states: [],
  markets: [],
  rankings: [],
  selectedCommodity: null,
  farmerLat: 20.5937,  // Default center of India
  farmerLng: 78.9629,
  quantity: 50,
  transportRate: 2.5,
  customTransportCost: null,
  charts: {},  // Chart.js instances
  map: null,   // Leaflet map instance
  markers: [], // Map markers
};

// ==========================================
// API Service
// ==========================================
const ApiService = {
  async fetchCommodities() {
    try {
      const response = await fetch('/api/commodities');
      if (!response.ok) throw new Error('Failed to fetch commodities');
      return await response.json();
    } catch (error) {
      console.error('Error fetching commodities:', error);
      showToast('Error loading commodities', 'error');
      return [];
    }
  },

  async fetchStates() {
    try {
      const response = await fetch('/api/states');
      if (!response.ok) throw new Error('Failed to fetch states');
      return await response.json();
    } catch (error) {
      console.error('Error fetching states:', error);
      showToast('Error loading states', 'error');
      return [];
    }
  },

  async fetchRanking(params) {
    try {
      const response = await fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to fetch rankings');
      return await response.json();
    } catch (error) {
      console.error('Error fetching rankings:', error);
      showToast('Error calculating rankings', 'error');
      return { success: false, data: [] };
    }
  },

  async fetchTrends(marketId, commodityId, days = 30) {
    try {
      const response = await fetch(`/api/trends?market_id=${marketId}&commodity_id=${commodityId}&days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      return await response.json();
    } catch (error) {
      console.error('Error fetching trends:', error);
      showToast('Error loading price trends', 'error');
      return { success: false, data: [] };
    }
  },

  async fetchMarketDetail(marketId) {
    try {
      const response = await fetch(`/api/market-detail/${marketId}`);
      if (!response.ok) throw new Error('Failed to fetch market details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching market details:', error);
      showToast('Error loading market details', 'error');
      return { success: false, data: null };
    }
  },

  async fetchDashboardStats() {
    try {
      const response = await fetch('/api/dashboard-stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { total_markets: 0, total_commodities: 0, active_users: 0 };
    }
  }
};

// ==========================================
// Initialization & UI Components
// ==========================================

async function initApp() {
  // Load data
  const [commoditiesData, statesData, statsData] = await Promise.all([
    ApiService.fetchCommodities(),
    ApiService.fetchStates(),
    ApiService.fetchDashboardStats()
  ]);

  AppState.commodities = Array.isArray(commoditiesData) ? commoditiesData : [];
  AppState.states = Array.isArray(statesData) ? statesData : [];

  populateCommodityDropdown(AppState.commodities);
  populateStateDropdown(AppState.states);
  updateDashboardStats(statsData);

  initMap();
  initWhatIfPanel();
  setupEventListeners();

  // Try to get geolocation
  getUserLocation(true);
}

function updateDashboardStats(stats) {
  const format = n => Number(n).toLocaleString('en-IN');
  const marketsEl = document.getElementById('stat-markets');
  if (marketsEl) marketsEl.textContent = format(stats.total_markets || 0);
  
  const commoditiesEl = document.getElementById('stat-commodities');
  if (commoditiesEl) commoditiesEl.textContent = format(stats.total_commodities || 0);
  
  const topPriceEl = document.getElementById('stat-top-price');
  if (topPriceEl && stats.highest_price_today) {
    topPriceEl.textContent = `₹${format(stats.highest_price_today.price || 0)}`;
  }
  
  const activeEl = document.getElementById('stat-active-mandi');
  if (activeEl && stats.highest_price_today) {
    activeEl.textContent = stats.highest_price_today.market || '--';
  }
}

function populateCommodityDropdown(commodities) {
  const select = document.getElementById('commodity-select');
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Select a commodity...</option>';
  
  // Group by category
  const groups = {};
  commodities.forEach(c => {
    if (!groups[c.category]) groups[c.category] = [];
    groups[c.category].push(c);
  });

  Object.keys(groups).sort().forEach(category => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = category;
    
    groups[category].forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      let mspText = c.msp ? ` (MSP: ₹${c.msp}/Qtl)` : '';
      option.textContent = `${c.name}${mspText}`;
      optgroup.appendChild(option);
    });
    
    select.appendChild(optgroup);
  });
}

function populateStateDropdown(states) {
  const select = document.getElementById('state-select');
  if (!select) return;

  select.innerHTML = '<option value="">All States</option>';
  states.sort().forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    select.appendChild(option);
  });
}

async function handleSearch() {
  const commodityId = document.getElementById('commodity-select').value;
  const latStr = document.getElementById('farmer-lat')?.value;
  const lngStr = document.getElementById('farmer-lng')?.value;
  const quantityStr = document.getElementById('quantity-input')?.value;
  const stateStr = document.getElementById('state-select')?.value;

  if (!commodityId) {
    showToast('Please select a commodity first', 'error');
    return;
  }

  let lat = AppState.farmerLat;
  let lng = AppState.farmerLng;
  if (latStr && lngStr) {
    lat = parseFloat(latStr);
    lng = parseFloat(lngStr);
    AppState.farmerLat = lat;
    AppState.farmerLng = lng;
  }
  
  let quantity = AppState.quantity;
  if(quantityStr) {
      quantity = parseFloat(quantityStr);
      AppState.quantity = quantity;
  }

  // Read transport rate from slider
  const rateEl = document.getElementById('transport-rate');
  if (rateEl) AppState.transportRate = parseFloat(rateEl.value);
  
  // Read custom transport cost
  const customEl = document.getElementById('custom-transport');
  if (customEl && customEl.value) {
    AppState.customTransportCost = parseFloat(customEl.value);
  } else {
    AppState.customTransportCost = null;
  }

  showLoading();

  const useLive = document.getElementById('live-data-toggle') ? document.getElementById('live-data-toggle').checked : true;

  const params = {
    commodity_id: commodityId,
    farmer_lat: lat,
    farmer_lng: lng,
    quantity_quintals: quantity,
    transport_rate_per_km_per_qtl: AppState.transportRate,
    custom_transport_cost: AppState.customTransportCost,
    use_live_data: useLive
  };

  const response = await ApiService.fetchRanking(params);
  const rankings = Array.isArray(response) ? response : [];
  
  if (rankings.length > 0) {
    AppState.rankings = rankings;
    AppState.selectedCommodity = commodityId;
    
    displayTopRecommendation(rankings);
    displayRankingTable(rankings);
    renderPriceComparisonChart(rankings);
    renderNetReturnChart(rankings);
    updateMap(lat, lng, rankings);

    // Load trend chart for top market
    const trendData = await ApiService.fetchTrends(rankings[0].id, commodityId);
    const trendArr = Array.isArray(trendData) ? trendData : [];
    if (trendArr.length > 0) {
      renderTrendChart(trendArr, rankings[0].name);
    }
    
    // Scroll to results
    const resultsEl = document.getElementById('results-content');
    if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
    showToast('Rankings updated successfully', 'success');
  } else {
    showToast('No markets found for this criteria', 'error');
  }

  hideLoading();
}

function displayTopRecommendation(rankings) {
  if (!rankings || rankings.length === 0) return;
  const top = rankings[0];
  
  // Update top recommendation card elements
  const nameEl = document.getElementById('top-mandi-name');
  if (nameEl) nameEl.textContent = `${top.name}, ${top.district}`;
  
  const distEl = document.getElementById('top-mandi-dist');
  if (distEl) distEl.textContent = `${top.district}, ${top.state}`;
  
  const distKmEl = document.getElementById('top-mandi-dist-km');
  if (distKmEl) distKmEl.textContent = top.distance_km.toFixed(1);
  
  const netEl = document.getElementById('top-mandi-net');
  animateCounter(netEl, top.net_return, 1000, '₹');
  
  const deductionsEl = document.getElementById('top-mandi-deductions');
  if (deductionsEl) deductionsEl.textContent = formatIndianCurrency(top.transport_cost + top.commission);

  // Update Live elements
  const liveBadge = document.getElementById('top-live-badge');
  const liveDate = document.getElementById('top-live-date');
  const livePrice = document.getElementById('top-live-price');
  const liveRange = document.getElementById('top-live-range');

  if (top.is_live) {
    if (liveBadge) liveBadge.classList.remove('hidden');
    if (liveDate) liveDate.textContent = top.live_arrival_date || 'Today';
    if (livePrice) livePrice.textContent = `₹${formatIndianCurrency(top.latest_price)}`;
    if (liveRange) {
      if (top.live_min_price && top.live_max_price) {
        liveRange.textContent = `(Day Range: ₹${formatIndianCurrency(top.live_min_price)} - ₹${formatIndianCurrency(top.live_max_price)})`;
      } else {
        liveRange.textContent = '';
      }
    }
  } else {
    if (liveBadge) liveBadge.classList.add('hidden');
    if (liveDate) liveDate.textContent = 'Benchmark Model';
    if (livePrice) livePrice.textContent = `₹${formatIndianCurrency(top.latest_price)}`;
    if (liveRange) liveRange.textContent = '';
  }

  // Update the trend badge in the header
  const trendBadgeSpan = document.querySelector('#top-recommendation .bg-white.text-brand');
  if (trendBadgeSpan) {
      const trendPct = (top.price_trend || 0).toFixed(1);
      let icon = 'fa-arrow-right';
      let label = 'Stable';
      if (trendPct > 0) { icon = 'fa-arrow-trend-up'; label = 'Rising'; }
      else if (trendPct < 0) { icon = 'fa-arrow-trend-down'; label = 'Falling'; }
      trendBadgeSpan.innerHTML = `<i class="fa-solid ${icon} mr-1"></i> ${label} (${trendPct > 0 ? '+' : ''}${trendPct}%)`;
  }

  // Update rationale / "Why this mandi?" section
  const transportEl = document.getElementById('top-rationale-transport');
  if (transportEl) transportEl.textContent = formatIndianCurrency(top.transport_cost);
  
  const commEl = document.getElementById('top-rationale-comm');
  if (commEl) commEl.textContent = formatIndianCurrency(top.commission);
  
  // Update explanation text
  const rationaleDiv = document.querySelector('#top-recommendation details .bg-black p');
  if (rationaleDiv) {
      let advantageText = "";
      if (rankings.length > 1) {
          const second = rankings[1];
          const diff = top.net_return - second.net_return;
          const diffPct = ((diff / Math.abs(second.net_return)) * 100).toFixed(1);
          advantageText = ` You save <strong>₹${formatIndianCurrency(diff)} (${diffPct}%)</strong> compared to the next best option (${second.name}).`;
      }
      const liveNote = top.is_live ? `<span class="text-yellow-300 font-semibold"> [Verified Live AGMARKNET Rate: ₹${formatIndianCurrency(top.latest_price)}/Qtl on ${top.live_arrival_date || 'today'}]</span>` : '';
      rationaleDiv.innerHTML = `${top.explanation || ''}${liveNote} Calculated with transport cost of ₹<span id="top-rationale-transport">${formatIndianCurrency(top.transport_cost)}</span> and commission of ₹<span id="top-rationale-comm">${formatIndianCurrency(top.commission)}</span>.${advantageText}`;
  }

  // Show results and hide empty state
  const emptyState = document.getElementById('empty-state');
  if (emptyState) emptyState.classList.add('hidden');
  
  const resultsContent = document.getElementById('results-content');
  if (resultsContent) {
    resultsContent.classList.remove('hidden');
    resultsContent.classList.add('flex');
  }
}

function displayRankingTable(rankings) {
  const tbody = document.getElementById('ranking-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  rankings.forEach((market, index) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b hover:bg-green-50 transition-colors';
    if (index === 0) tr.className += ' bg-green-50 font-bold';

    // Rank Badge
    let rankHtml = `<span class="text-gray-500">${index + 1}</span>`;
    if (index === 0) rankHtml = `<span class="rank-badge" style="background:linear-gradient(135deg,#FFD700,#FFA000);color:#fff;">🏆 1</span>`;
    else if (index === 1) rankHtml = `<span class="rank-badge" style="background:linear-gradient(135deg,#C0C0C0,#808080);color:#fff;">🥈 2</span>`;
    else if (index === 2) rankHtml = `<span class="rank-badge" style="background:linear-gradient(135deg,#CD7F32,#8B4513);color:#fff;">🥉 3</span>`;

    // Trend
    const trend = (market.price_trend || 0).toFixed(1);
    let trendIcon = trend > 0 ? '<i class="fas fa-caret-up text-green-600"></i>' : (trend < 0 ? '<i class="fas fa-caret-down text-red-600"></i>' : '<i class="fas fa-minus text-gray-400"></i>');
    let trendClass = trend > 0 ? 'bg-green-100 text-green-700' : (trend < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600');

    const returnClass = market.net_return > 0 ? 'text-green-700 font-bold' : 'text-red-600 font-bold';

    // Live tag & range
    const isLive = market.is_live;
    const liveTag = isLive 
      ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 ml-1.5 shadow-xs" title="Verified daily rate from AGMARKNET / Data.gov.in"><span class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse"></span>LIVE</span>` 
      : '';
    const dayRange = (isLive && market.live_min_price && market.live_max_price) 
      ? `<div class="text-[10px] text-gray-500 font-mono">Range: ₹${formatIndianCurrency(market.live_min_price)} - ₹${formatIndianCurrency(market.live_max_price)}</div>` 
      : `<div class="text-[10px] text-gray-400">Benchmark Model</div>`;

    tr.innerHTML = `
      <td class="px-3 py-3 text-center">${rankHtml}</td>
      <td class="px-3 py-3">
        <div class="font-semibold text-gray-800 flex items-center">${market.name} ${liveTag}</div>
        <div class="text-xs text-gray-500">${market.district}, ${market.state} ${isLive ? `• <span class="text-emerald-700 font-medium">${market.live_variety || 'FAQ'}</span>` : ''}</div>
      </td>
      <td class="px-3 py-3 text-right">
        <div class="font-bold text-gray-900">₹${formatIndianCurrency(market.latest_price)} ${trendIcon}</div>
        ${dayRange}
      </td>
      <td class="px-3 py-3 text-right">₹${formatIndianCurrency(market.transport_cost)}<br><span class="text-xs text-gray-400">(${market.distance_km.toFixed(1)} km)</span></td>
      <td class="px-3 py-3 text-right">₹${formatIndianCurrency(market.commission)}</td>
      <td class="px-3 py-3 text-right ${returnClass}">₹${formatIndianCurrency(market.net_return)}</td>
      <td class="px-3 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs font-medium ${trendClass}">${trend > 0 ? '+' : ''}${trend}%</span></td>
      <td class="px-3 py-3 text-center">
        <button class="text-emerald-600 hover:text-emerald-800 text-sm font-medium" onclick="showMarketDetail('${market.id}')">
          <i class="fas fa-chart-line"></i> Details
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// Charts (Chart.js)
// ==========================================

function destroyChart(chartName) {
  if (AppState.charts[chartName]) {
    AppState.charts[chartName].destroy();
    AppState.charts[chartName] = null;
  }
}

function renderPriceComparisonChart(rankings) {
  destroyChart('price-chart');
  const ctx = document.getElementById('price-chart');
  if(!ctx) return;

  const top10 = rankings.slice(0, 10);
  const labels = top10.map(r => r.name);
  const data = top10.map(r => r.latest_price);

  AppState.charts['price-chart'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Modal Price (₹/Qtl)',
        data: data,
        backgroundColor: 'rgba(40, 167, 69, 0.7)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: function(context) {
                    return `₹${formatIndianCurrency(context.raw)}`;
                }
            }
        }
      },
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}

function renderNetReturnChart(rankings) {
  destroyChart('return-chart');
  const ctx = document.getElementById('return-chart');
  if(!ctx) return;

  const top5 = rankings.slice(0, 5);
  const labels = top5.map(r => r.name);
  const netReturns = top5.map(r => r.net_return);
  const transports = top5.map(r => r.transport_cost);
  const commissions = top5.map(r => r.commission);

  AppState.charts['return-chart'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Net Return',
          data: netReturns,
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
        },
        {
          label: 'Transport Cost',
          data: transports,
          backgroundColor: 'rgba(253, 126, 20, 0.8)',
        },
        {
          label: 'Commission',
          data: commissions,
          backgroundColor: 'rgba(220, 53, 69, 0.8)',
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      },
      plugins: {
          tooltip: {
              callbacks: {
                  label: function(context) {
                      return `${context.dataset.label}: ₹${formatIndianCurrency(context.raw)}`;
                  }
              }
          }
      }
    }
  });
}

function renderTrendChart(trendData, marketName) {
    destroyChart('trend-chart');
    const ctx = document.getElementById('trend-chart');
    if(!ctx) return;

    if(!trendData || trendData.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center text-muted p-4">No trend data available</div>';
        return;
    }

    const labels = trendData.map(d => {
        const date = new Date(d.date);
        return `${date.getDate()}/${date.getMonth()+1}`;
    });
    
    const minPrices = trendData.map(d => d.min_price);
    const modalPrices = trendData.map(d => d.modal_price);
    const maxPrices = trendData.map(d => d.max_price);

    AppState.charts['trend-chart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Max Price',
                    data: maxPrices,
                    borderColor: 'rgba(200, 200, 200, 0.8)',
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Modal Price',
                    data: modalPrices,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    fill: '-1',
                    pointRadius: 3
                },
                {
                    label: 'Min Price',
                    data: minPrices,
                    borderColor: 'rgba(200, 200, 200, 0.8)',
                    borderDash: [5, 5],
                    fill: '-1',
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: `${marketName} - 30 Day Price Trend`
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

// ==========================================
// Map (Leaflet.js)
// ==========================================

function initMap() {
  const mapEl = document.getElementById('mandi-map');
  if (!mapEl || typeof L === 'undefined') return;

  AppState.map = L.map('mandi-map').setView([20.5937, 78.9629], 5);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(AppState.map);
}

function updateMap(farmerLat, farmerLng, rankings) {
  if (!AppState.map || !rankings || rankings.length === 0) return;

  // Clear existing markers and layers
  if (AppState.markers) {
    AppState.markers.forEach(m => AppState.map.removeLayer(m));
  }
  AppState.markers = [];
  
  // Remove existing polylines
  AppState.map.eachLayer(layer => {
      if(layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          AppState.map.removeLayer(layer);
      }
  });

  const bounds = [];

  // Farmer Marker
  const farmerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const farmerMarker = L.marker([farmerLat, farmerLng], {icon: farmerIcon}).bindPopup('<b>Your Location</b>');
  farmerMarker.addTo(AppState.map);
  AppState.markers.push(farmerMarker);
  bounds.push([farmerLat, farmerLng]);

  // Market Markers
  rankings.slice(0, 10).forEach((market, index) => {
    if (!market.lat || !market.lng) return;
    
    let color = index < 3 ? 'green' : 'orange';
    if(index === 0) color = 'gold';
    
    // Custom numbered icon
    const htmlIcon = createCustomIcon(color, index + 1);

    const marker = L.marker([market.lat, market.lng], {icon: htmlIcon});
    
    const popupContent = `
      <div class="text-center">
        <h6 class="mb-1">${market.name}</h6>
        <div class="small text-muted mb-2">${market.district}, ${market.state}</div>
        <table class="table table-sm mb-0">
            <tr><td>Price:</td><td class="text-end fw-bold">₹${formatIndianCurrency(market.latest_price)}/Qtl</td></tr>
            <tr><td>Distance:</td><td class="text-end">${market.distance_km.toFixed(1)} km</td></tr>
            <tr class="table-success"><td><b>Net Return:</b></td><td class="text-end fw-bold">₹${formatIndianCurrency(market.net_return)}</td></tr>
        </table>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    marker.addTo(AppState.map);
    AppState.markers.push(marker);
    bounds.push([market.lat, market.lng]);
  });

  // Draw line to top market
  if (rankings[0].lat && rankings[0].lng) {
      const topLat = rankings[0].lat;
      const topLng = rankings[0].lng;
      const polyline = L.polyline([[farmerLat, farmerLng], [topLat, topLng]], {color: 'green', weight: 3, opacity: 0.7, dashArray: '10, 10'});
      polyline.addTo(AppState.map);
  }

  // Fit bounds
  if (bounds.length > 0) {
    AppState.map.fitBounds(bounds, {padding: [50, 50]});
  }
}

function createCustomIcon(color, rank) {
  const bg = color === 'green' ? '#28a745' : (color === 'orange' ? '#fd7e14' : '#ffc107');
  const textColor = color === 'gold' ? '#000' : '#fff';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${bg}; color:${textColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${rank}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

// ==========================================
// What-If Analysis
// ==========================================

function initWhatIfPanel() {
  const qtySlider = document.getElementById('wi-qty-slider');
  const transportSlider = document.getElementById('wi-trans-slider');

  if (qtySlider) {
      qtySlider.addEventListener('input', () => {
          debouncedWhatIfChange();
      });
  }

  if (transportSlider) {
      transportSlider.addEventListener('input', () => {
          debouncedWhatIfChange();
      });
  }

  // Modal close button
  const modalCloseBtn = document.getElementById('modal-close');
  if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
  }

  // Close modal on background click
  const modalEl = document.getElementById('market-modal');
  if (modalEl) {
      modalEl.addEventListener('click', (e) => {
          if (e.target === modalEl) closeModal();
      });
  }
}

const debouncedWhatIfChange = debounce(async () => {
    if(!AppState.selectedCommodity || AppState.rankings.length === 0) return;

    const qty = document.getElementById('wi-qty-slider')?.value || AppState.quantity;
    const rate = document.getElementById('wi-trans-slider')?.value || AppState.transportRate;
    const useLive = document.getElementById('live-data-toggle') ? document.getElementById('live-data-toggle').checked : true;

    const params = {
        commodity_id: AppState.selectedCommodity,
        farmer_lat: AppState.farmerLat,
        farmer_lng: AppState.farmerLng,
        quantity_quintals: parseFloat(qty),
        transport_rate_per_km_per_qtl: parseFloat(rate),
        use_live_data: useLive
    };

    const response = await ApiService.fetchRanking(params);
    const rankings = Array.isArray(response) ? response : [];
    if(rankings.length > 0) {
        displayTopRecommendation(rankings);
        displayRankingTable(rankings);
        renderPriceComparisonChart(rankings);
        renderNetReturnChart(rankings);
        // Skip updating map to prevent flickering unless bounds changed significantly
    }
}, 500);


// ==========================================
// Market Detail Modal
// ==========================================

async function showMarketDetail(marketId) {
    showLoading();
    const market = await ApiService.fetchMarketDetail(marketId);
    hideLoading();

    if(!market || market.error) {
        showToast('Could not load market details', 'error');
        return;
    }
    
    const nameEl = document.getElementById('modal-mandi-name');
    if (nameEl) nameEl.textContent = market.name;
    const locEl = document.getElementById('modal-mandi-address');
    if (locEl) locEl.innerHTML = `<i class="fa-solid fa-map-pin mr-1"></i> ${market.district}, ${market.state}`;
    
    // Set stars
    const starsEl = document.getElementById('modal-rating');
    if(starsEl) {
        const rating = market.infrastructure_rating || 3;
        starsEl.innerHTML = '';
        for(let i=0; i<5; i++) {
            if(i < rating) starsEl.innerHTML += '<i class="fa-solid fa-star text-yellow-400"></i>';
            else starsEl.innerHTML += '<i class="fa-solid fa-star text-gray-300"></i>';
        }
    }

    // Commodities traded list with live AGMARKNET highlight
    const commoditiesEl = document.getElementById('modal-commodities');
    if (commoditiesEl) {
        let html = '';
        if (market.live_commodities_traded && market.live_commodities_traded.length > 0) {
            html += `<div class="w-full mb-2"><span class="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center"><span class="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1.5"></span> Live Auction Rates Today (AGMARKNET):</span></div><div class="w-full flex flex-wrap gap-1.5 mb-3">`;
            html += market.live_commodities_traded.map(c => `
                <span class="bg-red-50 text-red-900 text-xs px-2.5 py-1 rounded border border-red-200 font-semibold shadow-2xs">
                    ${c.commodity_name}: <strong class="text-red-700 font-bold">₹${formatIndianCurrency(c.latest_price)}</strong>/Qtl
                    <span class="text-[10px] text-gray-500 font-normal font-mono">(${c.variety || 'FAQ'})</span>
                </span>
            `).join('');
            html += `</div>`;
        }
        if (market.commodities_traded && market.commodities_traded.length > 0) {
            html += `<div class="w-full mt-2 mb-1"><span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">All Mandi Commodities (Historical):</span></div><div class="w-full flex flex-wrap gap-1.5">`;
            html += market.commodities_traded.map(c => `
                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded border border-green-200">
                    ${c.commodity_name} (₹${formatIndianCurrency(c.latest_price)})
                </span>
            `).join('');
            html += `</div>`;
        }
        commoditiesEl.innerHTML = html;
    }

    // Show modal
    const modalEl = document.getElementById('market-modal');
    if(modalEl) {
        modalEl.classList.remove('hidden');
    }

    // Load trends if we have a selected commodity
    if(AppState.selectedCommodity) {
        const trendData = await ApiService.fetchTrends(marketId, AppState.selectedCommodity);
        const trendArr = Array.isArray(trendData) ? trendData : [];
        if(trendArr.length > 0) {
            setTimeout(() => {
                renderTrendChart(trendArr, market.name);
            }, 200);
        }
    }
}

function closeModal() {
    const modalEl = document.getElementById('market-modal');
    if(modalEl) {
        modalEl.classList.add('hidden');
    }
}


// ==========================================
// Geolocation & Utility
// ==========================================

function getUserLocation(silent = false) {
  if (!navigator.geolocation) {
    if(!silent) showToast('Geolocation is not supported by your browser', 'error');
    return;
  }

  if(!silent) showToast('Getting your location...', 'info');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      AppState.farmerLat = lat;
      AppState.farmerLng = lng;

      const latInput = document.getElementById('farmer-lat');
      const lngInput = document.getElementById('farmer-lng');
      if (latInput) latInput.value = lat.toFixed(6);
      if (lngInput) lngInput.value = lng.toFixed(6);

      if(!silent) showToast('Location updated successfully', 'success');
      
      // Reverse geocoding could go here
    },
    (error) => {
      console.error('Error getting location:', error);
      if(!silent) showToast('Could not get your location', 'error');
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || document.body;
    
    let bgClass = 'bg-blue-500';
    let icon = 'fa-info-circle';
    if(type === 'success') { bgClass = 'bg-green-500'; icon = 'fa-check-circle'; }
    if(type === 'error') { bgClass = 'bg-red-500'; icon = 'fa-exclamation-circle'; }

    const toast = document.createElement('div');
    toast.className = `${bgClass} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 mb-2 toast`;
    toast.style.animation = 'slideInRight 0.3s ease-out';

    toast.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
      <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function formatIndianCurrency(amount) {
  return Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function animateCounter(element, target, duration, prefix = '') {
  if(!element) return;
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      clearInterval(timer);
      current = target;
    }
    element.textContent = prefix + formatIndianCurrency(current);
  }, 16);
}

// ==========================================
// Event Listeners Registration
// ==========================================

function setupEventListeners() {
    const searchBtn = document.getElementById('btn-search');
    if(searchBtn) searchBtn.addEventListener('click', handleSearch);

    const locateBtn = document.getElementById('btn-locate');
    if(locateBtn) locateBtn.addEventListener('click', () => getUserLocation(false));

    const commoditySelect = document.getElementById('commodity-select');
    if(commoditySelect) {
        commoditySelect.addEventListener('change', () => {
            if(searchBtn) searchBtn.disabled = false;
        });
    }

    const liveToggle = document.getElementById('live-data-toggle');
    if(liveToggle) {
        liveToggle.addEventListener('change', () => {
            if(AppState.selectedCommodity && AppState.rankings.length > 0) {
                handleSearch();
            }
        });
    }
}

// Boot up
document.addEventListener('DOMContentLoaded', initApp);
