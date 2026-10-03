const AtlasState = {
    map: null,
    markersLayer: null,
    choroplethLayer: null,
    rawMarkers: [],
    allMarkets: [],
    heatmapData: [],
    stateSummary: [],
    commodities: [],
    states: [],
    selectedState: null,
    selectedCommodity: null,
    selectedCategory: null,
    showChoropleth: true,
    showHeatmap: true,
    showClusters: true,
    charts: {},
    indiaGeoJSON: null,
};

document.addEventListener('DOMContentLoaded', initAtlas);

async function initAtlas() {
    showAtlasLoading();
    try {
        initMap();
        setupEventListeners();

        // 1. Fast unified init API for instant first-paint (<100ms)
        const initRes = await fetch('/api/atlas/init').catch(() => null);
        if (initRes && initRes.ok) {
            const data = await initRes.json();
            AtlasState.commodities = data.commodities || [];
            AtlasState.states = data.states || [];
            AtlasState.allMarkets = data.markets || [];
            AtlasState.stateSummary = data.state_summary || [];

            populateFilters();
            displayStateSummary(AtlasState.stateSummary);
            displayMarkets(AtlasState.allMarkets);
        } else {
            // Fallback if needed
            const [commoditiesRes, statesRes, marketsRes] = await Promise.all([
                fetch('/api/commodities').catch(() => null),
                fetch('/api/states').catch(() => null),
                fetch('/api/atlas/markets').catch(() => null)
            ]);

            if (commoditiesRes && commoditiesRes.ok) AtlasState.commodities = await commoditiesRes.json();
            if (statesRes && statesRes.ok) AtlasState.states = await statesRes.json();
            if (marketsRes && marketsRes.ok) AtlasState.allMarkets = await marketsRes.json();

            populateFilters();
            displayMarkets(AtlasState.allMarkets);
            fetchAndDisplayStateSummary();
        }
    } catch (error) {
        console.error("Error initializing atlas:", error);
    } finally {
        // HIDE LOADER IMMEDIATELY! Map and markets are ready for instant user interaction
        hideAtlasLoading();
    }

    // 2. Load GeoJSON in background without blocking map display or user interaction
    loadIndiaGeoJSON();
}

function initMap() {
    AtlasState.map = L.map('atlas-map', {
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
        maxBounds: L.latLngBounds(L.latLng(4.0, 60.0), L.latLng(39.0, 105.0)),
        maxBoundsViscosity: 0.6
    }).setView([22.5, 80.0], 5);

    L.control.zoom({ position: 'topright' }).addTo(AtlasState.map);

    // 100% Free OpenStreetMap Tile Layer (No API Key Required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(AtlasState.map);

    // Ensure map tiles calculate full container size
    setTimeout(() => {
        if (AtlasState.map) AtlasState.map.invalidateSize();
    }, 150);
    setTimeout(() => {
        if (AtlasState.map) AtlasState.map.invalidateSize();
    }, 500);
}

window.addEventListener('resize', () => {
    if (AtlasState.map) AtlasState.map.invalidateSize();
});

async function loadIndiaGeoJSON() {
    try {
        // Check sessionStorage cache for instant 0ms retrieval on repeat visits
        const cached = sessionStorage.getItem('india_geojson_cache');
        if (cached) {
            AtlasState.indiaGeoJSON = JSON.parse(cached);
            renderChoropleth();
            return;
        }

        let response = await fetch('/static/data/india-states.geojson').catch(() => null);
        if (!response || !response.ok) {
            response = await fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson').catch(() => null);
        }
        if (response && response.ok) {
            const gjText = await response.text();
            AtlasState.indiaGeoJSON = JSON.parse(gjText);
            try {
                sessionStorage.setItem('india_geojson_cache', gjText);
            } catch (storageErr) {
                // Ignore if storage quota is constrained
            }
            renderChoropleth();
        } else {
            console.warn("Failed to load India GeoJSON");
        }
    } catch (error) {
        console.warn("Error loading India GeoJSON:", error);
    }
}

function renderChoropleth() {
    if (!AtlasState.indiaGeoJSON || !AtlasState.showChoropleth) {
        if (AtlasState.choroplethLayer) {
            AtlasState.map.removeLayer(AtlasState.choroplethLayer);
            AtlasState.choroplethLayer = null;
        }
        return;
    }

    if (AtlasState.choroplethLayer) {
        AtlasState.map.removeLayer(AtlasState.choroplethLayer);
    }

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    const statePriceMap = {};
    const stateMandiMap = {};

    AtlasState.stateSummary.forEach(s => {
        const key = (s.state || '').toLowerCase().trim();
        if (s.avg_modal_price) {
            if (s.avg_modal_price < minPrice) minPrice = s.avg_modal_price;
            if (s.avg_modal_price > maxPrice) maxPrice = s.avg_modal_price;
            statePriceMap[key] = s.avg_modal_price;
        }
        stateMandiMap[key] = s.mandi_count || 0;
    });

    AtlasState.choroplethLayer = L.geoJSON(AtlasState.indiaGeoJSON, {
        style: function (feature) {
            const stateName = matchStateName(feature.properties);
            const key = (stateName || '').toLowerCase().trim();
            const price = statePriceMap[key];
            let color = '#ccc'; // default
            
            if (price && minPrice !== Infinity && maxPrice !== -Infinity && minPrice !== maxPrice) {
                color = getColor(price, minPrice, maxPrice);
            } else if (price && minPrice === maxPrice) {
                color = '#EAB308';
            }

            return {
                fillColor: color,
                weight: 1,
                opacity: 0.7,
                color: '#fff',
                fillOpacity: 0.5
            };
        },
        onEachFeature: function (feature, layer) {
            const stateName = matchStateName(feature.properties) || "Unknown";
            const key = stateName.toLowerCase().trim();
            const price = statePriceMap[key];
            const mandiCount = stateMandiMap[key] || 0;
            
            let tooltipContent = `${stateName}`;
            if (price) {
                tooltipContent += ` — Avg ${formatIndianCurrency(price)}/Qtl (${mandiCount} mandis)`;
            } else {
                tooltipContent += ` (${mandiCount} mandis)`;
            }

            layer.bindTooltip(tooltipContent);

            layer.on({
                mouseover: function (e) {
                    const l = e.target;
                    l.setStyle({
                        weight: 3,
                        color: '#666',
                        fillOpacity: 0.7
                    });
                    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                        l.bringToFront();
                    }
                },
                mouseout: function (e) {
                    if (AtlasState.choroplethLayer) {
                        AtlasState.choroplethLayer.resetStyle(e.target);
                    }
                },
                click: function (e) {
                    drillDownToState(stateName);
                }
            });
        }
    });

    AtlasState.choroplethLayer.addTo(AtlasState.map);
}

function displayMarkets(markets) {
    if (AtlasState.markersLayer) {
        AtlasState.map.removeLayer(AtlasState.markersLayer);
    }
    
    AtlasState.rawMarkers = [];

    const useClusters = AtlasState.showClusters && typeof L.markerClusterGroup === 'function';
    AtlasState.markersLayer = useClusters ? L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50
    }) : L.layerGroup();

    markets.forEach(market => {
        if (!market.lat || !market.lng) return;

        let color = '#3B82F6'; // default blue
        if (AtlasState.showHeatmap) {
            if (AtlasState.selectedCommodity && AtlasState.heatmapData.length > 0) {
                const hm = AtlasState.heatmapData.find(h => h.market_id === market.id);
                if (hm && hm.color_intensity !== undefined) {
                    color = priceToColor(hm.color_intensity);
                } else {
                    color = '#9CA3AF'; // gray if no data for this commodity
                }
            } else if (market.avg_price) {
                color = '#8B5CF6'; // purple for default avg
            }
        }

        const icon = createMarkerIcon(color, 12);
        const marker = L.marker([market.lat, market.lng], { icon: icon });
        
        let selectedCommInfo = '';
        if (AtlasState.selectedCommodity && AtlasState.heatmapData.length > 0) {
            const hm = AtlasState.heatmapData.find(h => h.market_id === market.id);
            if (hm) {
                const commObj = AtlasState.commodities.find(c => c.id === AtlasState.selectedCommodity);
                const commName = commObj ? commObj.name : 'Commodity';
                const trendIcon = hm.trend_7d > 0 ? '↑' : hm.trend_7d < 0 ? '↓' : '→';
                const trendColor = hm.trend_7d > 0 ? 'text-green-600' : hm.trend_7d < 0 ? 'text-red-600' : 'text-gray-600';
                selectedCommInfo = `
                    <div class="bg-emerald-50 border border-emerald-200 rounded p-2 mb-2">
                        <div class="text-xs font-semibold text-emerald-800">${commName}</div>
                        <div class="text-base font-bold text-gray-900">${formatIndianCurrency(hm.modal_price)}/Qtl <span class="text-xs ${trendColor} font-semibold">${trendIcon} ${hm.trend_7d ? hm.trend_7d.toFixed(1) + '%' : ''}</span></div>
                        <div class="text-[11px] text-gray-500">Min: ${formatIndianCurrency(hm.min_price)} | Max: ${formatIndianCurrency(hm.max_price)}</div>
                    </div>
                `;
            }
        }

        let topCommsHtml = '';
        if (!selectedCommInfo && market.top_commodities && market.top_commodities.length > 0) {
            topCommsHtml = market.top_commodities.slice(0, 4).map(tc => {
                const trendIcon = tc.trend_7d > 0 ? '↑' : tc.trend_7d < 0 ? '↓' : '-';
                const trendColor = tc.trend_7d > 0 ? 'text-green-500' : tc.trend_7d < 0 ? 'text-red-500' : 'text-gray-500';
                return `<div class="flex justify-between text-sm py-0.5">
                    <span>${tc.commodity_name}</span>
                    <span class="font-medium">${formatIndianCurrency(tc.modal_price)} <span class="${trendColor}">${trendIcon}</span></span>
                </div>`;
            }).join('');
        }

        const stars = '★'.repeat(market.infrastructure_rating || 3) + '☆'.repeat(5 - (market.infrastructure_rating || 3));

        const popupHtml = `
            <div class="atlas-popup p-2 min-w-[210px]">
                <h3 class="font-bold text-base text-gray-900 leading-tight">${market.name}</h3>
                <p class="text-gray-500 text-xs mb-1">${market.district || ''}, ${market.state}</p>
                <div class="text-yellow-500 text-xs mb-2">${stars}</div>
                ${selectedCommInfo}
                ${topCommsHtml ? `
                    <hr class="my-1.5">
                    <p class="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Top Commodities</p>
                    ${topCommsHtml}
                ` : ''}
                <hr class="my-2">
                <div class="text-xs flex justify-between items-center">
                    <span class="text-gray-600">Arr: ${(market.total_arrivals || 0).toLocaleString()} T</span>
                    <a href="/?commodity=${AtlasState.selectedCommodity || ''}&market=${market.id}" class="text-emerald-700 font-semibold hover:underline flex items-center gap-1">Advisor →</a>
                </div>
            </div>
        `;

        marker.bindPopup(popupHtml);
        marker.marketData = market;
        AtlasState.rawMarkers.push(marker);
        AtlasState.markersLayer.addLayer(marker);
    });

    AtlasState.markersLayer.addTo(AtlasState.map);
}

async function applyHeatmap(commodityId) {
    if (!commodityId) {
        AtlasState.heatmapData = [];
        displayMarkets(AtlasState.allMarkets);
        updateLegend('default');
        return;
    }

    try {
        const res = await fetch(`/api/atlas/heatmap?commodity_id=${commodityId}`);
        if (res.ok) {
            AtlasState.heatmapData = await res.json();
            
            filterMarkets(); 
            updateLegend('price');

            const summaryRes = await fetch(`/api/atlas/commodity-summary?commodity_id=${commodityId}`);
            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                displayCommodityDashboard(summaryData);
            }
        }
    } catch (e) {
        console.error("Error applying heatmap:", e);
    }
}

async function fetchAndDisplayStateSummary() {
    let url = '/api/atlas/state-summary';
    if (AtlasState.selectedCommodity) {
        url += `?commodity_id=${AtlasState.selectedCommodity}`;
    }
    try {
        const res = await fetch(url);
        if (res.ok) {
            AtlasState.stateSummary = await res.json();
            displayStateSummary(AtlasState.stateSummary);
            renderChoropleth();
        }
    } catch (e) {
        console.error("Error fetching state summary:", e);
    }
}

function displayStateSummary(summaryData) {
    const container = document.getElementById('state-summary-cards');
    if (!container) return;

    container.innerHTML = '';
    
    const sorted = [...summaryData].sort((a, b) => {
        if (a.avg_modal_price && b.avg_modal_price) return b.avg_modal_price - a.avg_modal_price;
        return (b.mandi_count || 0) - (a.mandi_count || 0);
    });

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 p-4">No state data available.</p>';
        return;
    }

    sorted.forEach(s => {
        if (AtlasState.selectedState && s.state !== AtlasState.selectedState) return;

        const trendIcon = s.trend_7d > 0 ? '↑' : s.trend_7d < 0 ? '↓' : '';
        const trendColor = s.trend_7d > 0 ? 'text-green-600' : s.trend_7d < 0 ? 'text-red-600' : 'text-gray-500';

        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition";
        card.onclick = () => drillDownToState(s.state);
        
        card.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="font-semibold text-gray-800">${s.state}</span>
                <span class="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">${s.mandi_count || 0} mandis</span>
            </div>
            ${s.avg_modal_price ? `
                <div class="text-sm text-gray-700 font-medium">
                    Avg: ${formatIndianCurrency(s.avg_modal_price)}/Qtl 
                    <span class="${trendColor} ml-1 text-xs">${trendIcon}</span>
                </div>
            ` : ''}
            <div class="text-xs text-gray-400 mt-1 flex justify-between">
                <span>Arr: ${(s.total_arrivals || 0).toLocaleString()} T</span>
                ${s.top_commodity ? `<span class="truncate ml-2" title="${s.top_commodity}">${s.top_commodity}</span>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

function drillDownToState(stateName) {
    AtlasState.selectedState = stateName;
    
    const stateSelect = document.getElementById('atlas-state-filter');
    if (stateSelect) stateSelect.value = stateName;

    const bc = document.getElementById('atlas-breadcrumb');
    if (bc) {
        bc.classList.remove('hidden');
        bc.innerHTML = `
            <a href="#" onclick="resetView(event)" class="text-emerald-700 font-semibold hover:underline flex items-center gap-1 inline-flex">
                <i class="fa-solid fa-earth-asia text-xs"></i> India
            </a>
            <span class="mx-2 text-gray-400">/</span>
            <span class="text-gray-900 font-bold">${stateName}</span>
        `;
    }

    filterMarkets();

    if (AtlasState.choroplethLayer) {
        let stateBounds = null;
        AtlasState.choroplethLayer.eachLayer(layer => {
            const layerState = matchStateName(layer.feature.properties);
            if (layerState && layerState.toLowerCase().trim() === stateName.toLowerCase().trim()) {
                stateBounds = layer.getBounds();
                layer.setStyle({ weight: 3, color: '#059669', fillOpacity: 0.35 });
            } else {
                layer.setStyle({ weight: 1, color: '#fff', fillOpacity: 0.1 });
            }
        });
        
        if (stateBounds) {
            AtlasState.map.fitBounds(stateBounds, { padding: [50, 50] });
        }
    }

    fetchAndDisplayStateSummary();
}

function resetView(e) {
    if (e) e.preventDefault();
    AtlasState.selectedState = null;

    const stateSelect = document.getElementById('atlas-state-filter');
    if (stateSelect) stateSelect.value = '';

    const bc = document.getElementById('atlas-breadcrumb');
    if (bc) {
        bc.classList.add('hidden');
        bc.innerHTML = `<span class="text-gray-800 font-medium">India</span>`;
    }

    AtlasState.map.setView([22.5, 82.0], 5);
    
    if (AtlasState.choroplethLayer) {
        AtlasState.choroplethLayer.eachLayer(layer => {
            AtlasState.choroplethLayer.resetStyle(layer);
        });
    }

    filterMarkets();
    fetchAndDisplayStateSummary();
}

function filterMarkets() {
    let filtered = AtlasState.allMarkets;

    if (AtlasState.selectedState) {
        filtered = filtered.filter(m => m.state.toLowerCase().trim() === AtlasState.selectedState.toLowerCase().trim());
    }

    if (AtlasState.selectedCategory && !AtlasState.selectedCommodity) {
        const commIdsInCat = new Set(
            AtlasState.commodities
                .filter(c => c.category === AtlasState.selectedCategory)
                .map(c => c.id)
        );
        filtered = filtered.filter(m => {
            if (!m.top_commodities) return true;
            return m.top_commodities.some(tc => commIdsInCat.has(tc.commodity_id));
        });
    }

    const searchInput = document.getElementById('atlas-search');
    if (searchInput && searchInput.value) {
        const q = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(m => 
            (m.name && m.name.toLowerCase().includes(q)) || 
            (m.district && m.district.toLowerCase().includes(q)) ||
            (m.state && m.state.toLowerCase().includes(q))
        );
    }

    if (AtlasState.selectedCommodity && AtlasState.heatmapData.length > 0) {
        const validMarketIds = new Set(AtlasState.heatmapData.map(h => h.market_id));
        filtered = filtered.filter(m => validMarketIds.has(m.id));
    }

    displayMarkets(filtered);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const searchMarkets = debounce(() => {
    filterMarkets();
}, 300);

function displayCommodityDashboard(data) {
    const dashboard = document.getElementById('commodity-dashboard');
    if (!dashboard) return;

    dashboard.classList.remove('hidden');
    // Ensure dashboard slides up into view if collapsed
    dashboard.classList.remove('translate-y-[250px]');
    dashboard.classList.add('translate-y-0');
    const content = document.getElementById('commodity-dashboard-content');
    if (content) content.classList.remove('hidden');
    const chevron = document.getElementById('dashboard-chevron');
    if (chevron) {
        chevron.classList.remove('rotate-0');
        chevron.classList.add('rotate-180');
    }

    setElText('cd-national-avg', `₹${formatIndianCurrency(data.national_avg_price)}/Qtl`);
    
    if (data.highest_market) {
        setElText('cd-highest', `${data.highest_market.name}, ${data.highest_market.state} — ₹${formatIndianCurrency(data.highest_market.price)}`);
    } else {
        setElText('cd-highest', 'N/A');
    }

    if (data.lowest_market) {
        setElText('cd-lowest', `${data.lowest_market.name}, ${data.lowest_market.state} — ₹${formatIndianCurrency(data.lowest_market.price)}`);
    } else {
        setElText('cd-lowest', 'N/A');
    }

    const mspEl = document.getElementById('cd-msp');
    if (mspEl) {
        if (data.msp) {
            const isPos = data.msp_delta >= 0;
            const sign = isPos ? '+' : '';
            const badgeClass = isPos ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            mspEl.innerHTML = `MSP: ₹${formatIndianCurrency(data.msp)} | <span class="px-2 py-0.5 rounded text-xs ${badgeClass}">${sign}₹${formatIndianCurrency(data.msp_delta)} (${data.msp_delta_pct || 0}%)</span>`;
        } else {
            mspEl.textContent = 'MSP: Not Applicable';
        }
    }

    if (data.lowest_market && data.highest_market) {
        const spread = data.highest_market.price - data.lowest_market.price;
        setElText('cd-range', `₹${formatIndianCurrency(data.lowest_market.price)} — ₹${formatIndianCurrency(data.highest_market.price)} (Spread: ₹${formatIndianCurrency(spread)})`);
    } else if (typeof data.price_range === 'number') {
        setElText('cd-range', `Spread: ₹${formatIndianCurrency(data.price_range)}`);
    }

    setElText('cd-markets-count', `${data.total_markets_trading || 0} mandis`);

    if (data.top_10_markets) {
        renderTop10Chart(data.top_10_markets);
    }
    if (data.state_averages) {
        renderStateAvgChart(data.state_averages);
    }
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderTop10Chart(top10Markets) {
    const ctx = document.getElementById('cd-top10-chart');
    if (!ctx) return;

    if (AtlasState.charts.top10) {
        AtlasState.charts.top10.destroy();
    }

    const labels = top10Markets.map(m => m.name || m.market_name || 'Market');
    const data = top10Markets.map(m => m.price || m.modal_price || 0);

    AtlasState.charts.top10 = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Modal Price (₹/Qtl)',
                data: data,
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1,
                borderRadius: 4
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
                            return formatIndianCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

function renderStateAvgChart(stateAverages) {
    const ctx = document.getElementById('cd-state-chart');
    if (!ctx) return;

    if (AtlasState.charts.stateAvg) {
        AtlasState.charts.stateAvg.destroy();
    }

    const sorted = [...stateAverages].sort((a, b) => b.avg_price - a.avg_price);
    const labels = sorted.map(s => s.state);
    const data = sorted.map(s => s.avg_price);

    AtlasState.charts.stateAvg = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg Price (₹/Qtl)',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                borderRadius: 4
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
                            return formatIndianCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

function updateLegend(mode) {
    const legendEl = document.getElementById('atlas-legend');
    if (!legendEl) return;

    if (mode === 'price') {
        legendEl.innerHTML = `
            <div class="text-xs font-semibold text-gray-700 mb-1">Price compared to National Avg</div>
            <div class="flex items-center w-full h-3 rounded bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 mb-1"></div>
            <div class="flex justify-between text-[10px] text-gray-500 font-medium">
                <span>Lower</span>
                <span>Average</span>
                <span>Higher</span>
            </div>
        `;
    } else {
        legendEl.innerHTML = `
            <div class="text-xs font-semibold text-gray-700 mb-1">Market Locations</div>
            <div class="flex items-center">
                <span class="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                <span class="text-xs text-gray-600">All Mandis</span>
            </div>
        `;
    }
}

function formatIndianCurrency(num) {
    if (!num) return '₹0';
    return '₹' + num.toLocaleString('en-IN');
}

function priceToColor(intensity) {
    const minColor = [34, 197, 94];
    const midColor = [234, 179, 8];
    const maxColor = [239, 68, 68];

    let c1, c2, t;
    if (intensity < 0.5) {
        c1 = minColor;
        c2 = midColor;
        t = intensity * 2;
    } else {
        c1 = midColor;
        c2 = maxColor;
        t = (intensity - 0.5) * 2;
    }

    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);

    return `rgb(${r}, ${g}, ${b})`;
}

function getColor(value, min, max) {
    const t = (value - min) / (max - min);
    return priceToColor(t);
}

function createMarkerIcon(color, size = 12) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
}

function matchStateName(properties) {
    if (!properties) return null;
    const keys = ['state', 'NAME_1', 'name', 'NAME', 'ST_NM'];
    for (let k of keys) {
        if (properties[k]) {
            let val = String(properties[k]).trim();
            if (val.toLowerCase() === 'nct of delhi') val = 'Delhi';
            if (val.toLowerCase() === 'orissa') val = 'Odisha';
            return val;
        }
    }
    return null;
}

function showAtlasLoading() {
    const loader = document.getElementById('atlas-loading') || document.getElementById('atlas-loader');
    if (loader) {
        loader.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        loader.classList.add('flex', 'opacity-100');
    }
}

function hideAtlasLoading() {
    const loader = document.getElementById('atlas-loading') || document.getElementById('atlas-loader');
    if (loader) {
        loader.classList.remove('opacity-100');
        loader.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            loader.classList.add('hidden');
            loader.classList.remove('flex');
            if (AtlasState.map) AtlasState.map.invalidateSize();
        }, 200);
    }
    if (AtlasState.map) AtlasState.map.invalidateSize();
}

function populateFilters() {
    const commSelect = document.getElementById('atlas-commodity-filter');
    const catSelect = document.getElementById('atlas-category-filter');
    const stateSelect = document.getElementById('atlas-state-filter');

    if (commSelect) {
        commSelect.innerHTML = '<option value="">All Commodities</option>';
        const byCat = {};
        AtlasState.commodities.forEach(c => {
            if (!byCat[c.category]) byCat[c.category] = [];
            byCat[c.category].push(c);
        });

        for (const [cat, comms] of Object.entries(byCat)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = cat;
            comms.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                optgroup.appendChild(opt);
            });
            commSelect.appendChild(optgroup);
        }
    }

    if (stateSelect) {
        stateSelect.innerHTML = '<option value="">All States</option>';
        AtlasState.states.sort().forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            stateSelect.appendChild(opt);
        });
    }

    if (catSelect) {
        const cats = [...new Set(AtlasState.commodities.map(c => c.category))].sort();
        catSelect.innerHTML = '<option value="">All Categories</option>';
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            catSelect.appendChild(opt);
        });
    }
}

function setupEventListeners() {
    const commSelect = document.getElementById('atlas-commodity-filter');
    if (commSelect) {
        commSelect.addEventListener('change', (e) => {
            AtlasState.selectedCommodity = e.target.value;
            if (AtlasState.selectedCommodity) {
                applyHeatmap(AtlasState.selectedCommodity);
            } else {
                applyHeatmap(null);
                const dashboard = document.getElementById('commodity-dashboard');
                if (dashboard) dashboard.classList.add('hidden');
            }
            fetchAndDisplayStateSummary();
        });
    }

    const stateSelect = document.getElementById('atlas-state-filter');
    if (stateSelect) {
        stateSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val) {
                drillDownToState(val);
            } else {
                resetView();
            }
        });
    }

    const catSelect = document.getElementById('atlas-category-filter');
    if (catSelect) {
        catSelect.addEventListener('change', (e) => {
            AtlasState.selectedCategory = e.target.value;
            if (commSelect) {
                commSelect.innerHTML = '<option value="">All Commodities</option>';
                const byCat = {};
                AtlasState.commodities
                    .filter(c => !AtlasState.selectedCategory || c.category === AtlasState.selectedCategory)
                    .forEach(c => {
                        if (!byCat[c.category]) byCat[c.category] = [];
                        byCat[c.category].push(c);
                    });

                for (const [cat, comms] of Object.entries(byCat)) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = cat;
                    comms.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.id;
                        opt.textContent = c.name;
                        optgroup.appendChild(opt);
                    });
                    commSelect.appendChild(optgroup);
                }
                commSelect.value = "";
                AtlasState.selectedCommodity = null;
                applyHeatmap(null);
                fetchAndDisplayStateSummary();
                filterMarkets();
            }
        });
    }

    const searchInp = document.getElementById('atlas-search');
    if (searchInp) {
        searchInp.addEventListener('input', searchMarkets);
    }

    const resetBtn = document.getElementById('reset-map-view');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => resetView(e));
    }

    const toggleChoro = document.getElementById('toggle-choropleth');
    if (toggleChoro) {
        toggleChoro.addEventListener('change', (e) => {
            AtlasState.showChoropleth = e.target.checked;
            renderChoropleth();
        });
    }

    const toggleHeatmap = document.getElementById('toggle-heatmap');
    if (toggleHeatmap) {
        toggleHeatmap.addEventListener('change', (e) => {
            AtlasState.showHeatmap = e.target.checked;
            filterMarkets();
        });
    }

    const toggleClusters = document.getElementById('toggle-clusters');
    if (toggleClusters) {
        toggleClusters.addEventListener('change', (e) => {
            AtlasState.showClusters = e.target.checked;
            filterMarkets(); 
        });
    }
    
    const closeDashboardBtn = document.getElementById('close-commodity-dashboard');
    if (closeDashboardBtn) {
        closeDashboardBtn.addEventListener('click', () => {
            const dashboard = document.getElementById('commodity-dashboard');
            if (dashboard) dashboard.classList.add('hidden');
        });
    }
}
