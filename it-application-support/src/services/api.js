const API_URL = `http://${window.location.hostname}:5000/api`;

// --- IN-MEMORY CACHE CORE ---
// Memastikan data di-cache selama 1 menit untuk menghilangkan lag saat pindah halaman
const CACHE_TTL = 60000;
const cache = {
    picIt: { data: null, timestamp: 0 },
    tickets: { data: null, timestamp: 0 }
};

export const invalidateCache = (key) => {
    if (cache[key]) {
        cache[key].data = null;
        cache[key].timestamp = 0;
    }
};

// --- TICKETS CACHE FETCH ---

export const getTickets = async () => {
    try {
        const now = Date.now();
        if (cache.tickets.data && now - cache.tickets.timestamp < CACHE_TTL) {
            return cache.tickets.data;
        }

        const response = await fetch(`${API_URL}/tickets`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        cache.tickets.data = data;
        cache.tickets.timestamp = now;

        return data;
    } catch (error) {
        console.error('Failed to fetch tickets:', error);
        return [];
    }
};

// --- PIC IT ---

export const getPicIt = async () => {
    try {
        const now = Date.now();
        // Cek jika data cache masih valid
        if (cache.picIt.data && now - cache.picIt.timestamp < CACHE_TTL) {
            return cache.picIt.data;
        }

        const response = await fetch(`${API_URL}/pic-it`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Simpan ke memory
        cache.picIt.data = data;
        cache.picIt.timestamp = now;

        return data;
    } catch (error) {
        console.error('Failed to fetch PIC IT:', error);
        return [];
    }
};

export const createPicNameOnly = async (pic_name) => {
    try {
        const response = await fetch(`${API_URL}/pic-it/pic-only`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pic_name })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create PIC');
        }
        const data = await response.json();
        invalidateCache('picIt');
        return data;
    } catch (error) {
        console.error('Failed to create PIC name:', error);
        throw error;
    }
};

export const createPicIt = async (picData) => {
    try {
        const response = await fetch(`${API_URL}/pic-it`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(picData)
        });
        const data = await response.json();
        invalidateCache('picIt'); // INVALIDASI CACHE OTOMATIS
        return data;
    } catch (error) {
        console.error('Failed to create PIC IT:', error);
        throw error;
    }
};

export const updatePicIt = async (id, picData) => {
    try {
        const response = await fetch(`${API_URL}/pic-it/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(picData)
        });
        const data = await response.json();
        invalidateCache('picIt'); // INVALIDASI CACHE OTOMATIS
        return data;
    } catch (error) {
        console.error('Failed to update PIC IT:', error);
        throw error;
    }
};

export const deletePicIt = async (id) => {
    try {
        const response = await fetch(`${API_URL}/pic-it/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        invalidateCache('picIt'); // INVALIDASI CACHE OTOMATIS
        return data;
    } catch (error) {
        console.error('Failed to delete PIC IT:', error);
        throw error;
    }
};

export const bulkUpdatePicName = async (oldName, newName) => {
    try {
        const response = await fetch(`${API_URL}/pic-it/bulk-name`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName, newName })
        });
        const data = await response.json();
        invalidateCache('picIt'); // INVALIDASI CACHE OTOMATIS
        return data;
    } catch (error) {
        console.error('Failed to update PIC Name:', error);
        throw error;
    }
};

export const bulkDeletePicGroup = async (picName) => {
    try {
        const response = await fetch(`${API_URL}/pic-it/group/${encodeURIComponent(picName)}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        invalidateCache('picIt'); // INVALIDASI CACHE OTOMATIS
        return data;
    } catch (error) {
        console.error('Failed to delete PIC Group:', error);
        throw error;
    }
};

// --- PIC KPIs ---

export const getPicKpis = async (picId) => {
    try {
        const response = await fetch(`${API_URL}/kpis/${picId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch KPIs:', error);
        return [];
    }
};

export const createPicKpi = async (kpiData) => {
    try {
        const response = await fetch(`${API_URL}/kpis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(kpiData)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Failed to create KPI:', error);
        throw error;
    }
};

export const updatePicKpi = async (id, kpiData) => {
    try {
        const response = await fetch(`${API_URL}/kpis/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(kpiData)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Failed to update KPI:', error);
        throw error;
    }
};

export const deletePicKpi = async (id) => {
    try {
        const response = await fetch(`${API_URL}/kpis/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Failed to delete KPI:', error);
        throw error;
    }
};
