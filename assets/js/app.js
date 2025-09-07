// App state
let currentTab = 0;
const tabs = ['trackers', 'groceries', 'bills'];
let groceryItems = JSON.parse(localStorage.getItem('groceryItems') || '[]');

// DOM elements (will be available when grocery section loads)
let itemInput, addBtn, groceryList, emptyState, totalItemsSpan, purchasedItemsSpan;

function initializeGroceryElements() {
    itemInput = document.getElementById('itemInput');
    addBtn = document.getElementById('addBtn');
    groceryList = document.getElementById('groceryList');
    emptyState = document.getElementById('emptyState');
    totalItemsSpan = document.getElementById('totalItems');
    purchasedItemsSpan = document.getElementById('purchasedItems');
    
    // Add event listeners
    if (addBtn) addBtn.addEventListener('click', addItem);
    if (itemInput) {
        itemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addItem();
        });
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript;base64,Y29uc3QgQ0FDSEVfTkFNRSA9ICdtLWFwcC12MSc7CmNvbnN0IFVSTFNUX1RPX0NBQ0hFID0gWycvJ107CgpzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2luc3RhbGwnLCAoZXZlbnQpID0+IHsKICAgIGV2ZW50LndhaXRVbnRpbCgKICAgICAgICBjYWNoZXMub3BlbihDQUNIRV9OQU1FKS50aGVuKChjYWNoZSkgPT4gewogICAgICAgICAgICByZXR1cm4gY2FjaGUuYWRkQWxsKFVSTFNfVE9fQ0FDSEUpOwogICAgICAgIH0pCiAgICApOwp9KTsKCnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCAoZXZlbnQpID0+IHsKICAgIGV2ZW50LnJlc3BvbmRXaXRoKAogICAgICAgIGNhY2hlcy5tYXRjaChldmVudC5yZXF1ZXN0KS50aGVuKChyZXNwb25zZSkgPT4gewogICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UgfHwgZmV0Y2goZXZlbnQucmVxdWVzdCk7CiAgICAgICAgfSkKICAgICk7Cn0pOw==');
}

// PWA Install
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installPrompt').classList.add('show');
});

document.getElementById('installPrompt').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        document.getElementById('installPrompt').classList.remove('show');
    }
});

// Touch handling for swipeable tabs
let startX = 0;
let startY = 0;

const appContainer = document.querySelector('.app-container');

appContainer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}, { passive: true });

appContainer.addEventListener('touchmove', (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - startX);
    const diffY = Math.abs(currentY - startY);
    
    if (diffX > diffY && diffX > 10) {
        e.preventDefault();
    }
}, { passive: false });

appContainer.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX - endX;
    const diffY = Math.abs(startY - endY);
    
    if (Math.abs(diffX) > 80 && Math.abs(diffX) > diffY) {
        if (diffX > 0 && currentTab < tabs.length - 1) {
            currentTab++;
            switchTab(tabs[currentTab]);
        } else if (diffX < 0 && currentTab > 0) {
            currentTab--;
            switchTab(tabs[currentTab]);
        }
    }
}, { passive: true });

// Tab switching
function switchTab(tabName) {
    currentTab = tabs.indexOf(tabName);
    
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab')[currentTab].classList.add('active');
    
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('grocerySection').style.display = 'none';
    
    if (tabName === 'groceries') {
        document.getElementById('grocerySection').style.display = 'block';
        initializeGroceryElements();
        renderGroceryItems();
    } else if (tabName === 'trackers') {
        alert('Trackers coming soon! Will include milk tracking and more.');
        document.getElementById('dashboard').style.display = 'block';
    } else if (tabName === 'bills') {
        alert('Bills tracking coming soon!');
        document.getElementById('dashboard').style.display = 'block';
    } else {
        document.getElementById('dashboard').style.display = 'block';
    }
    
    updateDashboardStats();
}

// Grocery list functions
function saveItems() {
    localStorage.setItem('groceryItems', JSON.stringify(groceryItems));
    updateDashboardStats();
}

function renderGroceryItems() {
    groceryList.innerHTML = '';
    
    if (groceryItems.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    groceryItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `list-item ${item.purchased ? 'purchased' : ''}`;
        
        itemDiv.innerHTML = `
            <input type="checkbox" ${item.purchased ? 'checked' : ''} onchange="toggleItem(${index})">
            <span class="item-text ${item.purchased ? 'purchased' : ''}">${item.name}</span>
            <button class="delete-btn" onclick="deleteItem(${index})">Delete</button>
        `;
        
        groceryList.appendChild(itemDiv);
    });
    
    updateGroceryStats();
}

function updateGroceryStats() {
    const total = groceryItems.length;
    const purchased = groceryItems.filter(item => item.purchased).length;
    if (totalItemsSpan) totalItemsSpan.textContent = total;
    if (purchasedItemsSpan) purchasedItemsSpan.textContent = purchased;
}

function updateDashboardStats() {
    const total = groceryItems.length;
    const purchased = groceryItems.filter(item => item.purchased).length;
    const remaining = total - purchased;
    
    const statsEl = document.getElementById('groceryStats');
    if (statsEl) {
        if (total === 0) {
            statsEl.textContent = '0 items';
        } else {
            statsEl.textContent = `${remaining} remaining of ${total}`;
        }
    }
}

function addItem() {
    const itemName = itemInput.value.trim();
    if (itemName === '') return;
    
    groceryItems.push({
        name: itemName,
        purchased: false,
        id: Date.now()
    });
    
    itemInput.value = '';
    saveItems();
    renderGroceryItems();
}

function toggleItem(index) {
    groceryItems[index].purchased = !groceryItems[index].purchased;
    saveItems();
    renderGroceryItems();
}

function deleteItem(index) {
    groceryItems.splice(index, 1);
    saveItems();
    renderGroceryItems();
}

// Initialize app
updateDashboardStats();