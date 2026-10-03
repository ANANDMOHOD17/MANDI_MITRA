let currentPage = 1;
let currentSortColumn = 'arrival_date';
let currentSortDir = 'desc';
let allData = [];
let refreshInterval;
let countdownInterval;
let timeLeft = 300;

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    loadSummary();
    loadData();
    startRefreshTimer();

    document.getElementById('filter-state').addEventListener('change', (e) => {
        loadDistricts(e.target.value);
    });

    document.getElementById('btn-search').addEventListener('click', () => {
        currentPage = 1;
        loadData();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        document.getElementById('filter-state').value = '';
        document.getElementById('filter-district').value = '';
        document.getElementById('filter-district').disabled = true;
        document.getElementById('filter-commodity').value = '';
        currentPage = 1;
        loadData();
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadData();
        }
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        currentPage++;
        loadData();
    });

    document.getElementById('manual-refresh').addEventListener('click', () => {
        refreshCache();
    });

    document.getElementById('btn-export').addEventListener('click', exportToCSV);

    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-sort');
            if (currentSortColumn === col) {
                currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = col;
                currentSortDir = 'asc';
            }
            renderTable();
        });
    });
});

async function initFilters() {
    try {
        const [statesRes, commoditiesRes] = await Promise.all([
            fetch('/api/live/states'),
            fetch('/api/live/commodities')
        ]);
        
        if (statesRes.ok) {
            const states = await statesRes.json();
            const stateSelect = document.getElementById('filter-state');
            states.forEach(s => {
                if (s) stateSelect.add(new Option(s, s));
            });
        }
        
        if (commoditiesRes.ok) {
            const commodities = await commoditiesRes.json();
            const commSelect = document.getElementById('filter-commodity');
            commodities.forEach(c => {
                if (c) commSelect.add(new Option(c, c));
            });
        }
    } catch (error) {
        console.error('Error loading filters:', error);
    }
}

async function loadDistricts(state) {
    const distSelect = document.getElementById('filter-district');
    distSelect.innerHTML = '<option value="">All Districts</option>';
    
    if (!state) {
        distSelect.disabled = true;
        return;
    }
    
    distSelect.disabled = false;
    try {
        const res = await fetch(`/api/live/districts?state=${encodeURIComponent(state)}`);
        if (res.ok) {
            const districts = await res.json();
            districts.forEach(d => {
                if (d) distSelect.add(new Option(d, d));
            });
        }
    } catch (error) {
        console.error('Error loading districts:', error);
    }
}

async function loadSummary() {
    try {
        const res = await fetch('/api/live/summary');
        if (res.ok) {
            const data = await res.json();
            document.getElementById('summary-records').innerText = data.total_records.toLocaleString();
            document.getElementById('summary-states').innerText = data.states_covered;
            document.getElementById('summary-highest').innerText = data.highest_priced || '--';
            document.getElementById('summary-lowest').innerText = data.lowest_priced || '--';

            if (data.source === 'unavailable' || data.source === 'fallback') {
                const status = document.getElementById('status-message');
                status.classList.remove('hidden');
                document.getElementById('status-text').innerText = data.source === 'unavailable' 
                    ? 'Live API unavailable and no cache found.' 
                    : 'Live API unavailable. Showing cached data.';
            } else {
                document.getElementById('status-message').classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

async function loadData() {
    const state = document.getElementById('filter-state').value;
    const district = document.getElementById('filter-district').value;
    const commodity = document.getElementById('filter-commodity').value;
    
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-gray-500"><i class="fa-solid fa-circle-notch fa-spin text-3xl mb-2 text-brand"></i><p>Loading...</p></td></tr>`;
    
    try {
        let url = `/api/live/prices?page=${currentPage}&per_page=50`;
        if (state) url += `&state=${encodeURIComponent(state)}`;
        if (district) url += `&district=${encodeURIComponent(district)}`;
        if (commodity) url += `&commodity=${encodeURIComponent(commodity)}`;
        
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            allData = data.records;
            renderTable();
            
            const total = data.total;
            const start = total === 0 ? 0 : (currentPage - 1) * 50 + 1;
            const end = Math.min(currentPage * 50, total);
            
            document.getElementById('page-start').innerText = start;
            document.getElementById('page-end').innerText = end;
            document.getElementById('page-total').innerText = total;
            document.getElementById('page-current').innerText = currentPage;
            
            document.getElementById('btn-prev').disabled = currentPage === 1;
            document.getElementById('btn-next').disabled = end >= total;
        }
    } catch (error) {
        console.error('Error loading data:', error);
        tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-red-500">Error loading data. Please try again.</td></tr>`;
    }
}

function renderTable() {
    const tbody = document.getElementById('table-body');
    
    if (allData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-gray-500">No data found for the selected filters.</td></tr>`;
        return;
    }
    
    // Sort
    const sorted = [...allData].sort((a, b) => {
        let valA = a[currentSortColumn];
        let valB = b[currentSortColumn];
        
        if (['min_price', 'max_price', 'modal_price'].includes(currentSortColumn)) {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        } else {
            valA = (valA || '').toString().toLowerCase();
            valB = (valB || '').toString().toLowerCase();
        }
        
        if (valA < valB) return currentSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Render
    tbody.innerHTML = sorted.map(row => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="p-3">${row.state || '-'}</td>
            <td class="p-3">${row.district || '-'}</td>
            <td class="p-3">${row.market || '-'}</td>
            <td class="p-3 font-medium">${row.commodity || '-'}</td>
            <td class="p-3">${row.variety || '-'}</td>
            <td class="p-3 text-right">₹${row.min_price}</td>
            <td class="p-3 text-right">₹${row.max_price}</td>
            <td class="p-3 text-right font-bold text-brand">₹${row.modal_price}</td>
            <td class="p-3">${row.arrival_date}</td>
        </tr>
    `).join('');
}

function startRefreshTimer() {
    if (countdownInterval) clearInterval(countdownInterval);
    timeLeft = 300;
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('refresh-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            refreshCache();
        }
    }, 1000);
}

async function refreshCache() {
    document.getElementById('manual-refresh').innerHTML = '<i class="fa-solid fa-sync fa-spin"></i>';
    try {
        await fetch('/api/live/refresh', { method: 'POST' });
        loadSummary();
        loadData();
    } catch (e) {
        console.error(e);
    } finally {
        document.getElementById('manual-refresh').innerHTML = '<i class="fa-solid fa-sync"></i>';
        startRefreshTimer();
    }
}

function exportToCSV() {
    if (allData.length === 0) return;
    
    const headers = ['State', 'District', 'Market', 'Commodity', 'Variety', 'Min Price', 'Max Price', 'Modal Price', 'Date'];
    const csvRows = [headers.join(',')];
    
    allData.forEach(row => {
        csvRows.push([
            `"${row.state || ''}"`,
            `"${row.district || ''}"`,
            `"${row.market || ''}"`,
            `"${row.commodity || ''}"`,
            `"${row.variety || ''}"`,
            row.min_price,
            row.max_price,
            row.modal_price,
            `"${row.arrival_date || ''}"`
        ].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandi_live_prices_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}
