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
        this.updateCartUI();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
    }

    updateCartItemQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartUI();
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
            console.log(`Loaded ${this.cart.length} items from saved cart`);
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
            UI.showToast('Error loading cart', 'error');
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
            this.filteredProducts = this.allProducts.filter(product => 
                product.category === category
            );
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
        const products = [...this.filteredProducts];
        
        switch (this.currentSort) {
            case 'price-asc':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                products.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                products.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            default:
                // Featured - keep original order
                break;
        }
        
        this.filteredProducts = products;
    }

    setSort(sortType) {
        this.currentSort = sortType;
        this.sortProducts();
        UI.renderProducts(this.filteredProducts);
    }
}

// ===== UI MANAGEMENT =====
class UI {
    static elements = {};

    static initialize() {
        // Cache DOM elements
        this.elements = {
            productGrid: document.getElementById('productGrid'),
            cartCount: document.getElementById('cart-count'),
            cartTotal: document.getElementById('cartTotal'),
            toast: document.getElementById('toast'),
            cartSidebar: document.getElementById('cartSidebar'),
            quickViewModal: document.getElementById('quick-view-modal'),
            quickViewContent: document.getElementById('quick-view-content'),
            cartItems: document.getElementById('cartItems'),
            searchInput: document.getElementById('search-input'),
            themeSwitcher: document.getElementById('theme-switcher'),
            header: document.querySelector('.site-header'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            sortSelect: document.getElementById('sort-select'),
            cartBtn: document.getElementById('cart-container'),
            mobileMenuBtn: document.getElementById('mobile-menu-btn'),
            navMenu: document.querySelector('.main-navigation'),
            loadingOverlay: document.getElementById('loading-overlay'),
            overlay: document.getElementById('overlay')
        };

        this.setupEventListeners();
        this.setupAccessibility();
    }

    static setupEventListeners() {
        // Theme switcher
        this.elements.themeSwitcher?.addEventListener('click', () => {
            appState.toggleTheme();
        });

        // Cart button
        this.elements.cartBtn?.addEventListener('click', () => {
            this.toggleCartSidebar();
        });

        // Search functionality
        this.elements.searchInput?.addEventListener('input', 
            debounce((e) => {
                appState.searchProducts(e.target.value);
            }, CONFIG.DEBOUNCE_DELAY)
        );

        // Filter buttons
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.updateFilterButtons(filter);
                appState.filterProducts(filter);
            });
        });

        // Sort functionality
        this.elements.sortSelect?.addEventListener('change', (e) => {
            appState.setSort(e.target.value);
        });

        // Mobile menu
        this.elements.mobileMenuBtn?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Modal close buttons
        document.querySelectorAll('.close-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal;
                this.closeModal(modalId);
            });
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Header scroll effect
        window.addEventListener('scroll', 
            throttle(() => {
                this.handleHeaderScroll();
            }, 100)
        );

        // Overlay click to close cart
        this.elements.overlay?.addEventListener('click', () => {
            this.toggleCartSidebar(false);
        });

        // Escape key to close cart
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleCartSidebar(false);
            }
        });
    }

    static setupAccessibility() {
        // Skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                target?.focus();
            });
        }

        // Focus trap for modals
        document.querySelectorAll('.modal').forEach(modal => {
            this.setupFocusTrap(modal);
        });
    }

    static setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }

    // Header scroll effect
    static handleHeaderScroll() {
        if (window.scrollY > 50) {
            this.elements.header?.classList.add('scrolled');
        } else {
            this.elements.header?.classList.remove('scrolled');
        }
    }

    // Theme management
    static applyTheme(theme) {
                 if (theme === 'dark') {
             document.body.classList.add('dark-mode');
             if (this.elements.themeSwitcher) {
                 this.elements.themeSwitcher.innerHTML = '<i class="fas fa-moon" aria-hidden="true"></i>';
             }
         } else {
             document.body.classList.remove('dark-mode');
             if (this.elements.themeSwitcher) {
                 this.elements.themeSwitcher.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
             }
         }
    }

    // Toast notifications
    static showToast(message, type = 'success') {
        if (!this.elements.toast) return;
        
        this.elements.toast.textContent = message;
        this.elements.toast.className = `toast show ${type}`;
        this.elements.toast.setAttribute('aria-hidden', 'false');
        
        // Auto-hide
        setTimeout(() => {
            this.hideToast();
        }, CONFIG.TOAST_DURATION);
        
        // Click to dismiss
        this.elements.toast.onclick = () => this.hideToast();
    }

    static hideToast() {
        if (this.elements.toast) {
            this.elements.toast.classList.remove('show');
            this.elements.toast.setAttribute('aria-hidden', 'true');
        }
    }

    // Loading states
    static showLoading(message = 'Loading...') {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.setAttribute('aria-hidden', 'false');
            this.elements.loadingOverlay.querySelector('p').textContent = message;
        }
    }

    static hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.setAttribute('aria-hidden', 'true');
        }
    }

    // Product rendering
    static renderProducts(products) {
        if (!this.elements.productGrid) return;

        if (products.length === 0) {
            this.elements.productGrid.innerHTML = `
                                 <div class="no-products">
                     <i class="fas fa-search" aria-hidden="true"></i>
                     <h3>No products found</h3>
                     <p>Try adjusting your search or filter criteria</p>
                 </div>
            `;
            return;
        }

        const productsHTML = products.map(product => this.createProductCard(product)).join('');
        this.elements.productGrid.innerHTML = productsHTML;

        // Add event listeners to new product cards
        this.setupProductCardListeners();
    }

    static createProductCard(product) {
        return `
            <article class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                                         <div class="product-overlay">
                         <button class="quick-view-btn" aria-label="Quick view ${product.name}">
                             <i class="fas fa-eye" aria-hidden="true"></i>
                         </button>
                         <button class="add-to-cart-btn" aria-label="Add ${product.name} to cart">
                             <i class="fas fa-plus" aria-hidden="true"></i>
                         </button>
                     </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <div class="product-price">₹${product.price.toLocaleString()}</div>
                </div>
            </article>
        `;
    }

    static setupProductCardListeners() {
        // Quick view buttons
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productCard = e.target.closest('.product-card');
                const productId = productCard.dataset.productId;
                const product = appState.allProducts.find(p => p.id === productId);
                if (product) {
                    this.showQuickView(product);
                }
            });
        });

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productCard = e.target.closest('.product-card');
                const productId = productCard.dataset.productId;
                const product = appState.allProducts.find(p => p.id === productId);
                if (product) {
                    appState.addToCart(product);
                    this.showToast(`${product.name} added to cart`, 'success');
                }
            });
        });
    }

    // Cart UI updates
    static updateCartUI() {
        // Update cart count
        if (this.elements.cartCount) {
            const count = appState.getCartCount();
            this.elements.cartCount.textContent = count;
            this.elements.cartCount.setAttribute('aria-label', `${count} items in cart`);
        }

        // Update cart total
        if (this.elements.cartTotal) {
            const total = appState.getCartTotal();
            this.elements.cartTotal.textContent = `₹${total.toLocaleString()}`;
        }

        // Update cart items in modal
        this.renderCartItems();
    }

    static renderCartItems() {
        if (!this.elements.cartItems) return;

        if (appState.cart.length === 0) {
            this.elements.cartItems.innerHTML = `
                                 <div class="empty-cart">
                     <i class="fas fa-shopping-bag" aria-hidden="true"></i>
                     <p>Your cart is empty</p>
                 </div>
            `;
            return;
        }

        const cartItemsHTML = appState.cart.map(item => this.createCartItemHTML(item)).join('');
        this.elements.cartItems.innerHTML = cartItemsHTML;

        // Add event listeners to cart item controls
        this.setupCartItemListeners();
    }

    static createCartItemHTML(item) {
        return `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="cart-item-category">${item.category}</p>
                    <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn minus" aria-label="Decrease quantity">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn plus" aria-label="Increase quantity">+</button>
                                         <button class="remove-item-btn" aria-label="Remove item">
                         <i class="fas fa-trash" aria-hidden="true"></i>
                     </button>
                </div>
            </div>
        `;
    }

    static setupCartItemListeners() {
        // Quantity controls
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const productId = cartItem.dataset.productId;
                const isPlus = e.target.classList.contains('plus');
                const currentQuantity = parseInt(cartItem.querySelector('.quantity-display').textContent);
                const newQuantity = isPlus ? currentQuantity + 1 : currentQuantity - 1;
                
                appState.updateCartItemQuantity(productId, newQuantity);
            });
        });

        // Remove item buttons
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const productId = cartItem.dataset.productId;
                appState.removeFromCart(productId);
                this.showToast('Item removed from cart', 'info');
            });
        });
    }

    // Cart sidebar management
    static toggleCartSidebar(open = null) {
        if (!this.elements.cartSidebar) return;
        
        const isOpen = open !== null ? open : this.elements.cartSidebar.classList.contains('open');
        
        if (isOpen) {
            this.elements.cartSidebar.classList.remove('open');
            document.body.classList.remove('cart-open');
        } else {
            this.elements.cartSidebar.classList.add('open');
            document.body.classList.add('cart-open');
        }
    }

    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.setAttribute('aria-hidden', 'false');
            modal.style.display = 'flex';
            
            // Focus first focusable element
            const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            firstFocusable?.focus();
            
            // Update cart button state
            if (modalId === 'cart-modal') {
                this.elements.cartBtn?.setAttribute('aria-expanded', 'true');
            }
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            modal.style.display = 'none';
            
            // Update cart button state
            if (modalId === 'cart-modal') {
                this.elements.cartBtn?.setAttribute('aria-expanded', 'false');
            }
        }
    }

    static closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.closeModal(modal.id);
        });
    }

    // Quick view functionality
    static showQuickView(product) {
        if (!this.elements.quickViewContent) return;

        this.elements.quickViewContent.innerHTML = `
            <div class="quick-view-product">
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="quick-view-details">
                    <h3>${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">₹${product.price.toLocaleString()}</div>
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;

        // Add event listener to quick view add to cart button
        const addToCartBtn = this.elements.quickViewContent.querySelector('.add-to-cart-btn');
        addToCartBtn?.addEventListener('click', () => {
            appState.addToCart(product);
            this.showToast(`${product.name} added to cart`, 'success');
            this.closeModal('quick-view-modal');
        });

        this.openModal('quick-view-modal');
    }

    // Filter button updates
    static updateFilterButtons(activeFilter) {
        this.elements.filterButtons.forEach(btn => {
            const isActive = btn.dataset.filter === activeFilter;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive.toString());
        });
    }

    // Mobile menu
    static toggleMobileMenu() {
        const isExpanded = this.elements.mobileMenuBtn?.getAttribute('aria-expanded') === 'true';
        this.elements.mobileMenuBtn?.setAttribute('aria-expanded', (!isExpanded).toString());
        this.elements.navMenu?.classList.toggle('mobile-open');
    }
}

// ===== API MANAGEMENT =====
class API {
    static async fetchProducts() {
        try {
            UI.showLoading('Loading products...');
            
            const response = await fetch('image-categories.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const categories = await response.json();
            return Object.keys(categories).map(key => {
                const product = categories[key];
                return {
                    id: key,
                    name: product.displayName,
                    category: product.category,
                    price: product.suggestedPriceRange.min,
                    description: product.description,
                    image: product.imageUrl,
                    rating: 4.5, // Default rating
                    reviews: Math.floor(Math.random() * 50) // Default reviews
                };
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            UI.showToast('Error loading products. Please try again.', 'error');
            return [];
        } finally {
            UI.hideLoading();
        }
    }
}


// ===== UTILITY FUNCTIONS =====
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== INITIALIZATION =====
let appState;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize app state
    appState = new AppState();
    appState.loadCart();

    // Initialize UI
    UI.initialize();
    
    // Fetch products
    appState.allProducts = await API.fetchProducts();
    appState.filterProducts();

    // Update cart UI
    UI.updateCartUI();

    console.log('JRP Courteries website initialized successfully');
});

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    UI.showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    UI.showToast('An unexpected error occurred', 'error');
});
