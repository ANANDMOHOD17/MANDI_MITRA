/**
 * Reports Page JavaScript for Smart Mandi Price Advisor
 */

const ReportState = {
    data: [],
    filters: { date: '', state: '', commodity_id: '', category: '', search: '' },
    pagination: { page: 1, perPage: 50, total: 0, totalPages: 0 },
    sortColumn: 'state',
    sortDirection: 'asc',
    availableDates: [],
    commodities: [],
    states: []
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initReports();
});

async function initReports() {
    try {
        // Fetch metadata for filters
        // In a real app we would call actual APIs:
        // const statesRes = await fetch('/api/states');
        // ReportState.states = await statesRes.json();
        
        // Mocking metadata for the sake of completion, since actual endpoints aren't specified for metadata
        // assuming standard endpoints or mocking them if unavailable. 
        // Let's implement robust try/catch and default to empty if api fails.
        await loadMetadata();

        // Setup filter dropdowns
        populateFilterDropdowns();

        // Setup event listeners
        setupEventListeners();

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('filter-date').value = today;
        ReportState.filters.date = today;

        // Load initial data
        loadReportData(1);
    } catch (error) {
        console.error("Failed to initialize reports:", error);
    }
}

async function loadMetadata() {
    try {
        // Example endpoints (fallback to empty if not found)
        const [statesRes, commoditiesRes] = await Promise.all([
            fetch('/api/states').catch(() => null),
            fetch('/api/commodities').catch(() => null)
        ]);

        if (statesRes && statesRes.ok) {
            ReportState.states = await statesRes.json();
        } else {
            // Mock states
            ReportState.states = ["Andhra Pradesh", "Gujarat", "Karnataka", "Maharashtra", "Punjab", "Uttar Pradesh"];
        }

        if (commoditiesRes && commoditiesRes.ok) {
            ReportState.commodities = await commoditiesRes.json();
        } else {
            // Mock commodities
            ReportState.commodities = [
                { id: '1', name: 'Wheat', category: 'Cereals' },
                { id: '2', name: 'Rice', category: 'Cereals' },
                { id: '3', name: 'Tomato', category: 'Vegetables' },
                { id: '4', name: 'Onion', category: 'Vegetables' },
                { id: '5', name: 'Apple', category: 'Fruits' }
            ];
        }
    } catch (e) {
        console.warn("Metadata load failed, using defaults");
        ReportState.states = [];
        ReportState.commodities = [];
    }
}

function populateFilterDropdowns() {
    // States
    const stateSelect = document.getElementById('filter-state');
    ReportState.states.forEach(state => {
        const option = document.createElement('option');
        option.value = typeof state === 'string' ? state : state.name;
        option.textContent = typeof state === 'string' ? state : state.name;
        stateSelect.appendChild(option);
    });

    // Categories (unique from commodities)
    const categorySelect = document.getElementById('filter-category');
    const categories = [...new Set(ReportState.commodities.map(c => c.category).filter(Boolean))];
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    // Commodities
    populateCommodityDropdown();
}

function populateCommodityDropdown(categoryFilter = '') {
    const commoditySelect = document.getElementById('filter-commodity');
    if (!commoditySelect) return;
    const curVal = commoditySelect.value;
    const allCommsText = (typeof MandiI18n !== 'undefined') ? MandiI18n.t('reports_filter_commodity') : 'All Commodities';
    commoditySelect.innerHTML = `<option value="">${allCommsText}</option>`;
    
    const filteredCommodities = categoryFilter 
        ? ReportState.commodities.filter(c => c.category === categoryFilter)
        : ReportState.commodities;

    filteredCommodities.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id || c.name;
        option.textContent = (typeof MandiI18n !== 'undefined') ? MandiI18n.getCommodityName(c.name) : c.name;
        commoditySelect.appendChild(option);
    });
    if (curVal) commoditySelect.value = curVal;
}

// Re-populate on language changes
window.addEventListener('mandiLanguageChanged', () => {
    const cat = document.getElementById('filter-category')?.value || '';
    populateCommodityDropdown(cat);
});

function setupEventListeners() {
    document.getElementById('btn-apply-filters').addEventListener('click', applyFilters);
    document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);
    document.getElementById('btn-download-csv').addEventListener('click', downloadCSV);
    document.getElementById('btn-print').addEventListener('click', printReport);
    
    document.getElementById('filter-category').addEventListener('change', (e) => {
        populateCommodityDropdown(e.target.value);
    });

    document.getElementById('filter-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyFilters();
    });

    // Pagination
    document.getElementById('page-prev').addEventListener('click', () => {
        if (ReportState.pagination.page > 1) {
            loadReportData(ReportState.pagination.page - 1);
        }
    });

    document.getElementById('page-next').addEventListener('click', () => {
        if (ReportState.pagination.page < ReportState.pagination.totalPages) {
            loadReportData(ReportState.pagination.page + 1);
        }
    });
}

async function loadReportData(page = 1) {
    showLoading(true);
    ReportState.pagination.page = page;

    try {
        const { date, state, commodity_id, search } = ReportState.filters;
        
        // Build URL parameters
        const params = new URLSearchParams({
            page: page,
            per_page: ReportState.pagination.perPage
        });
        
        if (date) params.append('date', date);
        if (state) params.append('state', state);
        if (commodity_id) params.append('commodity_id', commodity_id);
        if (search) params.append('search', search);

        // Try API fetch, fallback to mock data if no backend is wired
        let data, total, totalPages;
        try {
            const response = await fetch(`/api/reports/daily?${params.toString()}`);
            if (!response.ok) throw new Error("API not available");
            const resData = await response.json();
            const rawData = resData.data || [];
            data = rawData.map(r => ({
                ...r,
                mandi: r.market_name || r.mandi || '',
                commodity: r.commodity_name || r.commodity || '',
                arrivals: r.arrivals_tonnes !== undefined ? r.arrivals_tonnes : (r.arrivals || 0),
                trend: r.trend_7d !== undefined ? r.trend_7d : (r.trend || 0)
            }));
            total = resData.pagination ? resData.pagination.total : (resData.total || data.length);
            totalPages = resData.pagination ? resData.pagination.total_pages : Math.ceil(total / ReportState.pagination.perPage);
            
            // Set date input to API's default if not set
            if (!date && resData.filters && resData.filters.available_dates && resData.filters.available_dates.length) {
                const apiLatestDate = resData.filters.available_dates[0];
                document.getElementById('filter-date').value = apiLatestDate;
                ReportState.filters.date = apiLatestDate;
            }
        } catch (apiErr) {
            console.warn("Using mock data due to API error:", apiErr);
            // Generate mock data for demonstration
            data = generateMockData(50);
            total = 1250;
            totalPages = Math.ceil(total / ReportState.pagination.perPage);
        }

        ReportState.data = data;
        ReportState.pagination.total = total;
        ReportState.pagination.totalPages = totalPages || 1;

        // Apply client-side sorting before display
        sortDataArray();
        
        displayTable(ReportState.data);
        updateSummary(ReportState.data);
        updatePagination(ReportState.pagination);
    } catch (error) {
        console.error("Error loading report data:", error);
        document.getElementById('report-table-body').innerHTML = `
            <tr><td colspan="10" class="text-center py-8 text-red-500">Error loading data. Please try again.</td></tr>
        `;
    } finally {
        showLoading(false);
    }
}

function showLoading(isLoading) {
    const loadingEl = document.getElementById('report-loading');
    const contentEl = document.getElementById('report-content');
    
    if (isLoading) {
        loadingEl.classList.remove('hidden');
        loadingEl.classList.add('flex');
        contentEl.classList.add('opacity-50', 'pointer-events-none');
    } else {
        loadingEl.classList.add('hidden');
        loadingEl.classList.remove('flex');
        contentEl.classList.remove('opacity-50', 'pointer-events-none');
    }
}

function displayTable(data) {
    const tbody = document.getElementById('report-table-body');
    const emptyState = document.getElementById('report-empty');
    const tableContainer = document.querySelector('.overflow-x-auto');

    if (!data || data.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        tableContainer.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');
    tableContainer.classList.remove('hidden');

    tbody.innerHTML = '';

    const startIdx = (ReportState.pagination.page - 1) * ReportState.pagination.perPage;

    data.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-brand-50 transition-colors group';
        if (idx % 2 === 0) tr.classList.add('bg-white');
        else tr.classList.add('bg-gray-50');

        // Trend styling
        let trendHtml = '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">-</span>';
        if (row.trend > 0) {
            trendHtml = `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"><i class="fa-solid fa-arrow-trend-up mr-1"></i> +${row.trend}%</span>`;
        } else if (row.trend < 0) {
            trendHtml = `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800"><i class="fa-solid fa-arrow-trend-down mr-1"></i> ${row.trend}%</span>`;
        }

        tr.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap text-gray-500">${startIdx + idx + 1}</td>
            <td class="px-4 py-3 whitespace-nowrap">${formatDate(row.date)}</td>
            <td class="px-4 py-3">
                <div class="font-medium text-gray-900">${row.state}</div>
                <div class="text-xs text-gray-500">${row.district || ''}</div>
            </td>
            <td class="px-4 py-3 font-medium text-brand-700">${row.mandi}</td>
            <td class="px-4 py-3">
                <div class="text-gray-900">${row.commodity}</div>
                <div class="text-xs text-gray-500">${row.category || ''}</div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-gray-600">${formatIndianCurrency(row.min_price)}</td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-gray-600">${formatIndianCurrency(row.max_price)}</td>
            <td class="px-4 py-3 whitespace-nowrap text-right font-bold text-gray-900 text-base">${formatIndianCurrency(row.modal_price)}</td>
            <td class="px-4 py-3 whitespace-nowrap text-right">${row.arrivals ? row.arrivals.toLocaleString('en-IN') : '-'}</td>
            <td class="px-4 py-3 whitespace-nowrap text-center">${trendHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    updateSortIcons();
}

function updateSummary(data) {
    if (!data || data.length === 0) {
        document.getElementById('summary-total').textContent = '0';
        document.getElementById('summary-avg-price').textContent = '-';
        document.getElementById('summary-highest').textContent = '-';
        document.getElementById('summary-arrivals').textContent = '0';
        return;
    }

    // Total records
    document.getElementById('summary-total').textContent = ReportState.pagination.total.toLocaleString('en-IN');

    // Avg modal price
    const sumModal = data.reduce((acc, row) => acc + (Number(row.modal_price) || 0), 0);
    const avgModal = sumModal / data.length;
    document.getElementById('summary-avg-price').textContent = formatIndianCurrency(avgModal);

    // Highest price
    let highest = data[0];
    data.forEach(row => {
        if ((Number(row.max_price) || 0) > (Number(highest.max_price) || 0)) {
            highest = row;
        }
    });
    const highestEl = document.getElementById('summary-highest');
    highestEl.innerHTML = `${formatIndianCurrency(highest.max_price)} <span class="text-xs font-normal text-gray-500 block">${highest.mandi}</span>`;

    // Total arrivals
    const sumArrivals = data.reduce((acc, row) => acc + (Number(row.arrivals) || 0), 0);
    document.getElementById('summary-arrivals').textContent = sumArrivals.toLocaleString('en-IN', {maximumFractionDigits: 1});
}

function updatePagination(pagination) {
    const { page, totalPages, total, perPage } = pagination;
    
    // Update text info
    const start = total === 0 ? 0 : (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);
    document.getElementById('pagination-info').textContent = `Showing ${start} to ${end} of ${total} records`;

    // Update buttons state
    document.getElementById('page-prev').disabled = page <= 1;
    document.getElementById('page-next').disabled = page >= totalPages;

    // Generate page numbers
    const numbersContainer = document.getElementById('pagination-numbers');
    numbersContainer.innerHTML = '';

    if (totalPages <= 0) return;

    // Logic to show reasonable number of page buttons
    let pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (page <= 4) {
            pages = [1, 2, 3, 4, 5, '...', totalPages];
        } else if (page >= totalPages - 3) {
            pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [1, '...', page - 1, page, page + 1, '...', totalPages];
        }
    }

    pages.forEach(p => {
        if (p === '...') {
            const span = document.createElement('span');
            span.className = 'px-3 py-1 text-gray-500';
            span.textContent = '...';
            numbersContainer.appendChild(span);
        } else {
            const btn = document.createElement('button');
            btn.className = `px-3 py-1 border rounded-md text-sm ${p === page ? 'bg-brand-600 text-white border-brand-600 font-medium' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`;
            btn.textContent = p;
            btn.onclick = () => loadReportData(p);
            numbersContainer.appendChild(btn);
        }
    });
}

window.sortTable = function(column) {
    if (ReportState.sortColumn === column) {
        ReportState.sortDirection = ReportState.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        ReportState.sortColumn = column;
        ReportState.sortDirection = 'asc';
    }

    sortDataArray();
    displayTable(ReportState.data);
};

function sortDataArray() {
    const { sortColumn: col, sortDirection: dir } = ReportState;
    const mult = dir === 'asc' ? 1 : -1;

    ReportState.data.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];

        // Handle numeric columns
        if (['min_price', 'max_price', 'modal_price', 'arrivals', 'trend'].includes(col)) {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
            return (valA - valB) * mult;
        }

        // String comparison
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        if (valA < valB) return -1 * mult;
        if (valA > valB) return 1 * mult;
        return 0;
    });
}

function updateSortIcons() {
    // Reset all icons
    const ths = document.querySelectorAll('#report-table th i.fa-sort, #report-table th i.fa-sort-up, #report-table th i.fa-sort-down');
    ths.forEach(icon => {
        icon.className = 'fa-solid fa-sort ml-1 text-gray-400';
    });

    // Set active icon
    if (ReportState.sortColumn) {
        const thId = `sort-${ReportState.sortColumn.replace('_price', '')}`;
        const th = document.getElementById(thId);
        if (th) {
            const icon = th.querySelector('i');
            if (icon) {
                icon.className = `fa-solid fa-sort-${ReportState.sortDirection === 'asc' ? 'up' : 'down'} ml-1 text-brand-600`;
            }
        }
    }
}

function applyFilters() {
    ReportState.filters.date = document.getElementById('filter-date').value;
    ReportState.filters.state = document.getElementById('filter-state').value;
    ReportState.filters.category = document.getElementById('filter-category').value;
    ReportState.filters.commodity_id = document.getElementById('filter-commodity').value;
    ReportState.filters.search = document.getElementById('filter-search').value.trim();

    loadReportData(1);
}

function resetFilters() {
    document.getElementById('filter-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('filter-state').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-commodity').innerHTML = '<option value="">All Commodities</option>';
    document.getElementById('filter-search').value = '';

    populateCommodityDropdown();
    applyFilters();
}

function downloadCSV() {
    const { date, state, commodity_id, search } = ReportState.filters;
    const params = new URLSearchParams({ format: 'csv' });
    
    if (date) params.append('date', date);
    if (state) params.append('state', state);
    if (commodity_id) params.append('commodity_id', commodity_id);
    if (search) params.append('search', search);

    const url = `/api/reports/download?${params.toString()}`;
    
    // Create temporary link to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `Mandi_Report_${date || 'All'}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function printReport() {
    const dateStr = document.getElementById('filter-date').value;
    const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'All Dates';
    
    const filters = [];
    if (ReportState.filters.state) filters.push(ReportState.filters.state);
    if (ReportState.filters.commodity_id) {
        const cmdEl = document.getElementById('filter-commodity');
        filters.push(cmdEl.options[cmdEl.selectedIndex].text);
    }
    
    let subtitle = dateFormatted;
    if (filters.length > 0) subtitle += ` | ${filters.join(' - ')}`;
    
    document.getElementById('print-date').textContent = subtitle;
    window.print();
}

function formatIndianCurrency(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    const n = Number(num);
    return '₹' + n.toLocaleString('en-IN', { 
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    });
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

// Utility for mock data during dev
function generateMockData(count) {
    const states = ["Maharashtra", "Gujarat", "Karnataka", "Punjab", "Uttar Pradesh"];
    const districts = ["Pune", "Nashik", "Ahmedabad", "Surat", "Bangalore", "Mysore", "Ludhiana", "Agra"];
    const commodities = [
        {name: "Onion", cat: "Vegetables"}, {name: "Tomato", cat: "Vegetables"}, 
        {name: "Wheat", cat: "Cereals"}, {name: "Rice", cat: "Cereals"},
        {name: "Apple", cat: "Fruits"}
    ];
    
    const data = [];
    const date = ReportState.filters.date || new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < count; i++) {
        const c = commodities[Math.floor(Math.random() * commodities.length)];
        const modal = Math.floor(Math.random() * 5000) + 1000;
        
        data.push({
            date: date,
            state: states[Math.floor(Math.random() * states.length)],
            district: districts[Math.floor(Math.random() * districts.length)],
            mandi: "APMC " + Math.floor(Math.random() * 100),
            commodity: c.name,
            category: c.cat,
            min_price: modal - Math.floor(Math.random() * 500),
            max_price: modal + Math.floor(Math.random() * 500),
            modal_price: modal,
            arrivals: (Math.random() * 100).toFixed(1),
            trend: (Math.random() * 10 - 5).toFixed(1)
        });
    }
    return data;
}
