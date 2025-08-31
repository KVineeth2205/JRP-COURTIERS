// ===== JRP COURTERIES - ENHANCED JAVASCRIPT =====

// ===== CONFIGURATION =====
const CONFIG = {
    CART_STORAGE_KEY: 'jrp_shopping_cart',
    THEME_STORAGE_KEY: 'jrp_theme',
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
};

// ===== STATE MANAGEMENT =====
class AppState {
    constructor() {
        this.cart = [];
        this.allProducts = [];
        this.filteredProducts = [];
        this.theme = 'light';
    }

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
        return this.cart.reduce((total, item) => total + (item.suggestedPriceRange.min * item.quantity), 0);
    }

    getCartCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    saveCart() {
        localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(this.cart));
    }

    loadCart() {
        const savedCart = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
        this.cart = savedCart ? JSON.parse(savedCart) : [];
    }

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

    filterAndSortProducts(filter = 'all', sort = 'featured') {
        let products = [...this.allProducts];

        if (filter !== 'all') {
            products = products.filter(product => product.category === filter);
        }
        
        if (sort === 'price-low') {
            products.sort((a, b) => a.suggestedPriceRange.min - b.suggestedPriceRange.min);
        } else if (sort === 'price-high') {
            products.sort((a, b) => b.suggestedPriceRange.min - a.suggestedPriceRange.min);
        }

        this.filteredProducts = products;
        UI.renderProducts(this.filteredProducts);
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
            overlay: document.getElementById('overlay'),
            toast: document.getElementById('toast'),
            ctaButton: document.querySelector('.cta-button')
        };
        this.setupEventListeners();
    }

    static setupEventListeners() {
        this.elements.themeSwitcher?.addEventListener('click', () => appState.toggleTheme());
        this.elements.cartBtn?.addEventListener('click', () => this.toggleCartSidebar(true));
        this.elements.closeCartBtn?.addEventListener('click', () => this.toggleCartSidebar(false));
        this.elements.overlay?.addEventListener('click', () => this.toggleCartSidebar(false));
        this.elements.searchIcon?.addEventListener('click', () => this.elements.searchInput.focus());
        this.elements.ctaButton?.addEventListener('click', () => document.getElementById('collections').scrollIntoView({ behavior: 'smooth' }));

        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.updateFilterButtons(filter);
                appState.filterAndSortProducts(filter, this.elements.sortSelect.value);
            });
        });

        this.elements.sortSelect.addEventListener('change', (e) => {
            const sort = e.target.value;
            const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
            appState.filterAndSortProducts(activeFilter, sort);
        });

        window.addEventListener('scroll', throttle(() => {
            this.elements.header?.classList.toggle('scrolled', window.scrollY > 50);
        }, 100));
    }

    static applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        if (this.elements.themeSwitcher) {
            this.elements.themeSwitcher.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }

    static toggleCartSidebar(open) {
        document.body.classList.toggle('cart-open', open);
        this.elements.cartSidebar.classList.toggle('open', open);
    }

    static renderProducts(products) {
        if (!this.elements.productGrid) return;
        this.elements.productGrid.innerHTML = products.map(p => this.createProductCard(p)).join('');
        this.setupProductCardListeners();
    }

    static createProductCard(product) {
        return `
            <div class="product-card" data-aos="fade-up" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.displayName}" loading="lazy">
                    <div class="product-overlay">
                        <button class="add-to-cart-btn">
                            <i class="fas fa-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <p class="product-category">${product.category}</p>
                    <h4>${product.displayName}</h4>
                    <p class="product-price">₹${product.suggestedPriceRange.min.toLocaleString()}</p>
                </div>
            </div>`;
    }

    static setupProductCardListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.product-card').dataset.productId;
                const product = appState.allProducts.find(p => p.id === productId);
                if (product) {
                    appState.addToCart(product);
                    this.showToast(`${product.displayName} added to cart!`);
                }
            });
        });
    }

    static updateCartUI() {
        if (this.elements.cartCount) {
            this.elements.cartCount.textContent = appState.getCartCount();
        }
        if (this.elements.cartTotal) {
            this.elements.cartTotal.textContent = `₹${appState.getCartTotal().toLocaleString()}`;
        }
        this.renderCartItems();
    }

    static renderCartItems() {
        if (!this.elements.cartItems) return;
        if (appState.cart.length === 0) {
            this.elements.cartItems.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>`;
            return;
        }
        this.elements.cartItems.innerHTML = appState.cart.map(item => this.createCartItemHTML(item)).join('');
        this.setupCartItemListeners();
    }
    
    static createCartItemHTML(item) {
        return `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.imageUrl}" alt="${item.displayName}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.displayName}</h4>
                    <p class="cart-item-price">₹${item.suggestedPriceRange.min.toLocaleString()}</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn minus">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn plus">+</button>
                    <button class="remove-item-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
    }

    static setupCartItemListeners() {
        this.elements.cartItems.querySelectorAll('.cart-item').forEach(itemEl => {
            const productId = itemEl.dataset.productId;
            itemEl.querySelector('.plus').addEventListener('click', () => {
                const item = appState.cart.find(i => i.id === productId);
                appState.updateCartItemQuantity(productId, item.quantity + 1);
            });
            itemEl.querySelector('.minus').addEventListener('click', () => {
                const item = appState.cart.find(i => i.id === productId);
                appState.updateCartItemQuantity(productId, item.quantity - 1);
            });
            itemEl.querySelector('.remove-item-btn').addEventListener('click', () => {
                appState.removeFromCart(productId);
            });
        });
    }

    static showToast(message) {
        if (!this.elements.toast) return;
        this.elements.toast.textContent = message;
        this.elements.toast.classList.add('show');
        setTimeout(() => this.elements.toast.classList.remove('show'), CONFIG.TOAST_DURATION);
    }
    
    static updateFilterButtons(activeFilter) {
        this.elements.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === activeFilter);
        });
    }
}

// ===== API & UTILITIES =====
const API = {
    fetchProducts: async () => {
        try {
            const response = await fetch('image-categories.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const categories = await response.json();
            return Object.entries(categories).map(([id, data]) => ({ id, ...data }));
        } catch (error) {
            console.error('Error fetching products:', error);
            UI.showToast('Error loading products.');
            return [];
        }
    }
};
const throttle = (func, limit) => { let inThrottle; return (...args) => { if (!inThrottle) { func(...args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } } };
const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), delay); } };

// ===== INITIALIZATION =====
let appState;
document.addEventListener('DOMContentLoaded', async () => {
    appState = new AppState();
    appState.loadCart();
    appState.loadTheme();

    UI.initialize();
    
    appState.allProducts = await API.fetchProducts();
    appState.filterAndSortProducts();

    UI.updateCartUI();

    AOS.init({
        duration: 800,
        once: true,
        offset: 50,
    });
});
