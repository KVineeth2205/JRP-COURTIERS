// ===== JRP COURTERIES - ENHANCED JAVASCRIPT =====
// Modular, well-organized, and performant code

// ===== CONFIGURATION =====
const CONFIG = {
    API_BASE_URL: '/api',
    ITEMS_PER_PAGE: 12,
    CART_STORAGE_KEY: 'jrp_shopping_cart',
    THEME_STORAGE_KEY: 'jrp_theme',
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300
};

// ===== STATE MANAGEMENT =====
class AppState {
    constructor() {
        this.cart = [];
        this.allProducts = [];
        this.filteredProducts = [];
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.currentSort = 'featured';
        this.isLoading = false;
        this.searchQuery = '';
        this.theme = 'light';
    }

    // Cart management
    addToCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ ...product, quantity });
        }
        this.saveCart();
        UI.updateCartUI();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        UI.updateCartUI();
    }

    updateCartItemQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                UI.updateCartUI();
            }
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    saveCart() {
        try {
            localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart:', error);
            UI.showToast('Error saving cart', 'error');
        }
    }

    loadCart() {
        try {
            const savedCart = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
            this.cart = savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }

    // Theme management
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem(CONFIG.THEME_STORAGE_KEY, this.theme);
        UI.applyTheme(this.theme);
        UI.showToast(`Switched to ${this.theme} mode`, 'info');
    }

    loadTheme() {
        this.theme = localStorage.getItem(CONFIG.THEME_STORAGE_KEY) || 'light';
        UI.applyTheme(this.theme);
    }

    // Product filtering and sorting
    filterProducts(category = 'all') {
        this.currentFilter = category;
        this.currentPage = 1;
        if (category === 'all') {
            this.filteredProducts = [...this.allProducts];
        } else {
            this.filteredProducts = this.allProducts.filter(product => product.category === category);
        }
        this.sortProducts();
        UI.renderProducts(this.filteredProducts);
    }

    searchProducts(query) {
        this.searchQuery = query.toLowerCase();
        this.currentPage = 1;
        if (!query.trim()) {
            this.filterProducts(this.currentFilter);
            return;
        }
        this.filteredProducts = this.allProducts.filter(product =>
            product.name.toLowerCase().includes(this.searchQuery) ||
            product.category.toLowerCase().includes(this.searchQuery) ||
            product.description.toLowerCase().includes(this.searchQuery)
        );
        this.sortProducts();
        UI.renderProducts(this.filteredProducts);
    }

    sortProducts() {
        // Sort logic remains the same
    }

    setSort(sortType) {
        // Set sort logic remains the same
    }
}

// ===== UI MANAGEMENT =====
class UI {
    static elements = {};

    static initialize() {
        this.elements = {
            productGrid: document.getElementById('productGrid'),
            cartCount: document.getElementById('cart-count'),
            cartTotal: document.getElementById('cartTotal'),
            toast: document.getElementById('toast'),
            cartSidebar: document.getElementById('cartSidebar'),
            cartItems: document.getElementById('cartItems'),
            searchInput: document.getElementById('search-input'),
            searchIcon: document.getElementById('search-icon'),
            themeSwitcher: document.getElementById('theme-switcher'),
            header: document.getElementById('site-header'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            sortSelect: document.getElementById('sort-select'),
            cartBtn: document.getElementById('cart-container'),
            closeCartBtn: document.getElementById('close-cart-btn'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            overlay: document.getElementById('overlay')
        };
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // Theme switcher
        this.elements.themeSwitcher?.addEventListener('click', () => appState.toggleTheme());

        // Cart functionality
        this.elements.cartBtn?.addEventListener('click', () => this.toggleCartSidebar(true));
        this.elements.closeCartBtn?.addEventListener('click', () => this.toggleCartSidebar(false));
        this.elements.overlay?.addEventListener('click', () => this.toggleCartSidebar(false));

        // Search functionality
        this.elements.searchInput?.addEventListener('input', debounce(e => appState.searchProducts(e.target.value), CONFIG.DEBOUNCE_DELAY));
        this.elements.searchIcon?.addEventListener('click', () => this.elements.searchInput.focus());

        // Filter buttons
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', e => {
                const filter = e.target.dataset.filter;
                this.updateFilterButtons(filter);
                appState.filterProducts(filter);
            });
        });

        // Header scroll effect
        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 50) {
                this.elements.header?.classList.add('scrolled');
            } else {
                this.elements.header?.classList.remove('scrolled');
            }
        }, 100));
    }

    static applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        if (this.elements.themeSwitcher) {
            this.elements.themeSwitcher.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }

    static toggleCartSidebar(open) {
        const isOpen = this.elements.cartSidebar.classList.contains('open');
        if (open === isOpen) return;

        if (open) {
            this.elements.cartSidebar.classList.add('open');
            document.body.classList.add('cart-open');
        } else {
            this.elements.cartSidebar.classList.remove('open');
            document.body.classList.remove('cart-open');
        }
    }
    
    // All other UI methods like renderProducts, showToast, etc., remain the same.
    // ... [ The rest of the UI class methods from the previous step go here ] ...
    static showToast(message, type = 'success') { if (!this.elements.toast) return; this.elements.toast.textContent = message; this.elements.toast.className = `toast show ${type}`; setTimeout(() => { this.elements.toast.classList.remove('show'); }, CONFIG.TOAST_DURATION); }
    static renderProducts(products) { if (!this.elements.productGrid) return; if (products.length === 0) { this.elements.productGrid.innerHTML = `<p>No products found.</p>`; return; } const productsHTML = products.map(p => this.createProductCard(p)).join(''); this.elements.productGrid.innerHTML = productsHTML; this.setupProductCardListeners(); }
    static createProductCard(product) { return `<article class="product-card" data-product-id="${product.id}"><div class="product-image"><img src="${product.imageUrl}" alt="${product.name}" loading="lazy"><div class="product-overlay"><button class="quick-view-btn"><i class="fas fa-eye"></i></button><button class="add-to-cart-btn"><i class="fas fa-plus"></i></button></div></div><div class="product-info"><h4>${product.displayName}</h4><p class="product-price">₹${product.suggestedPriceRange.min.toLocaleString()}</p></div></article>`; }
    static setupProductCardListeners() { document.querySelectorAll('.add-to-cart-btn').forEach(btn => { btn.addEventListener('click', e => { const productId = e.target.closest('.product-card').dataset.productId; const product = appState.allProducts.find(p => p.id === productId); if (product) { appState.addToCart(product); this.showToast(`${product.name} added to cart!`); } }); }); }
    static updateCartUI() { if (this.elements.cartCount) { this.elements.cartCount.textContent = appState.getCartCount(); } if (this.elements.cartTotal) { this.elements.cartTotal.textContent = `${appState.getCartTotal().toLocaleString()}`; } this.renderCartItems(); }
    static renderCartItems() { if (!this.elements.cartItems) return; if (appState.cart.length === 0) { this.elements.cartItems.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>`; return; } this.elements.cartItems.innerHTML = appState.cart.map(item => `<div class="cart-item" data-product-id="${item.id}"><img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image"> ... </div>`).join(''); }
    static updateFilterButtons(activeFilter) { this.elements.filterButtons.forEach(btn => { btn.classList.toggle('active', btn.dataset.filter === activeFilter); }); }
}

// ===== API MANAGEMENT =====
class API {
    static async fetchProducts() {
        try {
            const response = await fetch('image-categories.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const categories = await response.json();
            return Object.entries(categories).map(([id, data]) => ({ id, ...data }));
        } catch (error) {
            console.error('Error fetching products:', error);
            UI.showToast('Error loading products.', 'error');
            return [];
        }
    }
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
function throttle(func, limit) { let inThrottle; return function(...args) { if (!inThrottle) { func.apply(this, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } }; }
function scrollToCollection() { document.getElementById('collections').scrollIntoView({ behavior: 'smooth' }); }

// ===== INITIALIZATION =====
let appState;

document.addEventListener('DOMContentLoaded', async () => {
    appState = new AppState();
    appState.loadCart();
    appState.loadTheme(); // Load theme on start

    UI.initialize();
    
    appState.allProducts = await API.fetchProducts();
    appState.filterProducts();

    UI.updateCartUI();
    console.log('JRP Courteries website initialized successfully');
});
