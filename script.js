document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        navToggle: document.querySelector('.nav-toggle'),
        nav: document.getElementById('primary-navigation'),
        cartToggle: document.getElementById('cartToggle'),
        cartPage: document.getElementById('cartPage'),
        cartPageBack: document.getElementById('cartPageBack'),
        cartPageItemsList: document.getElementById('cartPageItemsList'),
        cartPageEmpty: document.getElementById('cartPageEmpty'),
        cartPageSubtotal: document.getElementById('cartPageSubtotal'),
        cartPageTax: document.getElementById('cartPageTax'),
        cartPageTotal: document.getElementById('cartPageTotal'),
        cartPageCheckout: document.getElementById('cartPageCheckout'),
        cartPageContinue: document.getElementById('cartPageContinue'),
        cartPageEmptyBrowse: document.getElementById('cartPageEmptyBrowse'),
        overlay: document.getElementById('overlay'),
        menuSearch: document.getElementById('menuSearch'),
        menuContainer: document.getElementById('menuContainer'),
        menuEmpty: document.getElementById('menuEmpty'),
        toastContainer: document.getElementById('toastContainer'),
        orderModal: document.getElementById('orderModal'),
        modalClose: document.querySelector('.modal-close'),
        orderTitle: document.getElementById('orderTitle'),
        orderDescription: document.getElementById('orderDescription'),
        orderPrice: document.getElementById('orderPrice'),
        orderImage: document.getElementById('orderImage'),
        qtyMinus: document.getElementById('qtyMinus'),
        qtyPlus: document.getElementById('qtyPlus'),
        orderQuantity: document.getElementById('orderQuantity'),
        toppingInputs: document.querySelectorAll('.topping-input'),
        orderTotal: document.getElementById('orderTotal'),
        confirmOrder: document.getElementById('confirmOrder'),
        cartCount: document.getElementById('cartCount'),
        cards: document.querySelectorAll('.card'),
        sections: document.querySelectorAll('.animate-on-scroll')
    };

    const CART_KEY = 'tastybite-cart';
    const state = {
        cart: [],
        currentDish: null,
        activeOverlay: null
    };

    const getCardData = (card) => ({
        name: card.dataset.name,
        desc: card.dataset.desc,
        price: parseFloat(card.dataset.price),
        image: card.dataset.image
    });

    const formatMoney = (amount) => `$${amount.toFixed(2)}`;

    const loadCart = () => {
        const stored = localStorage.getItem(CART_KEY);
        state.cart = stored ? JSON.parse(stored) : [];
    };

    const saveCart = () => {
        localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    };

    const lockScroll = () => {
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = scrollBarWidth ? `${scrollBarWidth}px` : '';
    };

    const unlockScroll = () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    };

    const getCartCount = () => state.cart.reduce((sum, item) => sum + item.quantity, 0);

    const updateCartCount = () => {
        const count = getCartCount();
        if (elements.cartCount) elements.cartCount.textContent = count;
    };

    const calculateCartTotals = () => {
        const subtotal = state.cart.reduce((sum, item) => {
            const itemTotal = (item.price * item.quantity) + item.toppings.reduce((s, t) => s + t.price, 0);
            return sum + itemTotal;
        }, 0);
        const tax = subtotal * 0.10;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    const renderCartPage = () => {
        const { subtotal, tax, total } = calculateCartTotals();
        
        if (state.cart.length === 0) {
            elements.cartPageItemsList.innerHTML = '';
            elements.cartPageEmpty.hidden = false;
            elements.cartPageSubtotal.textContent = formatMoney(0);
            elements.cartPageTax.textContent = formatMoney(0);
            elements.cartPageTotal.textContent = formatMoney(0);
            return;
        }

        elements.cartPageEmpty.hidden = true;
        elements.cartPageItemsList.innerHTML = '';

        state.cart.forEach((item, index) => {
            const itemTotal = (item.price * item.quantity) + item.toppings.reduce((s, t) => s + t.price, 0);
            const toppingsText = item.toppings.length ? item.toppings.map(t => t.label).join(', ') : 'No extras';

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-page-item';
            cartItem.dataset.index = index;
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-page-item-image">
                <div>
                    <h3 class="cart-page-item-title">${item.name}</h3>
                    <p class="cart-page-item-toppings">${toppingsText}</p>
                    <div class="cart-page-item-controls">
                        <div class="cart-page-item-qty">
                            <button class="qty-decrease" aria-label="Decrease quantity">−</button>
                            <span>${item.quantity}</span>
                            <button class="qty-increase" aria-label="Increase quantity">+</button>
                        </div>
                        <span class="cart-page-item-price">${formatMoney(itemTotal)}</span>
                        <button class="cart-page-item-remove" type="button" aria-label="Remove item">Remove</button>
                    </div>
                </div>
            `;
            elements.cartPageItemsList.appendChild(cartItem);
        });

        elements.cartPageSubtotal.textContent = formatMoney(subtotal);
        elements.cartPageTax.textContent = formatMoney(tax);
        elements.cartPageTotal.textContent = formatMoney(total);
    };

    const showCartPage = () => {
        elements.cartPage.hidden = false;
        renderCartPage();
        lockScroll();
        window.scrollTo(0, 0);
    };

    const hideCartPage = () => {
        elements.cartPage.hidden = true;
        unlockScroll();
    };

    const setOverlay = (visible) => {
        const overlay = elements.overlay;
        if (!overlay) return;
        if (visible) {
            overlay.hidden = false;
            overlay.classList.add('visible');
        } else {
            overlay.classList.remove('visible');
            window.setTimeout(() => overlay.hidden = true, 250);
        }
    };

    const openNav = () => {
        elements.nav.classList.add('open');
        elements.navToggle.setAttribute('aria-expanded', 'true');
        state.activeOverlay = 'nav';
        setOverlay(true);
    };

    const closeNav = () => {
        elements.nav.classList.remove('open');
        elements.navToggle.setAttribute('aria-expanded', 'false');
        setOverlay(false);
        state.activeOverlay = null;
    };

    const closeActive = () => {
        if (state.activeOverlay === 'nav') closeNav();
        if (elements.orderModal.getAttribute('aria-hidden') === 'false') closeModal();
        if (!elements.cartPage.hidden) hideCartPage();
    };

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        elements.toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        window.setTimeout(() => {
            toast.classList.remove('show');
            window.setTimeout(() => toast.remove(), 250);
        }, 2800);
    };

    const updateOrderTotal = () => {
        if (!state.currentDish) return;
        const quantity = Math.max(1, Number(elements.orderQuantity.value) || 1);
        const toppingCost = Array.from(elements.toppingInputs).reduce((sum, input) => {
            return input.checked ? sum + Number(input.value) : sum;
        }, 0);
        const total = (state.currentDish.price * quantity) + toppingCost;
        elements.orderTotal.textContent = formatMoney(total);
        elements.orderPrice.textContent = formatMoney(state.currentDish.price);
    };

    const openModal = (dish) => {
        state.currentDish = dish;
        elements.orderTitle.textContent = dish.name;
        elements.orderDescription.textContent = dish.desc;
        elements.orderImage.src = dish.image;
        elements.orderImage.alt = dish.name;
        elements.orderQuantity.value = 1;
        elements.toppingInputs.forEach((input) => (input.checked = false));
        updateOrderTotal();
        elements.orderModal.setAttribute('aria-hidden', 'false');
        setOverlay(true);
        state.activeOverlay = 'modal';
        lockScroll();
        const firstFocusable = elements.orderModal.querySelector('button, input');
        firstFocusable?.focus();
    };

    const closeModal = () => {
        elements.orderModal.setAttribute('aria-hidden', 'true');
        setOverlay(false);
        state.activeOverlay = null;
        unlockScroll();
    };

    const parseToppings = () => {
        return Array.from(elements.toppingInputs)
            .filter((input) => input.checked)
            .map((input) => {
                const labelText = input.parentElement?.textContent || input.value;
                const label = labelText.replace(/\+\$\d+(?:\.\d{2})?$/, '').trim();
                return { label, price: Number(input.value) };
            });
    };

    const createCartKey = (dish, toppings) => `${dish.name}|${toppings.map((item) => item.label).sort().join(',')}`;

    const addToCart = () => {
        if (!state.currentDish) return;
        const quantity = Math.max(1, Number(elements.orderQuantity.value) || 1);
        const toppings = parseToppings();
        const key = createCartKey(state.currentDish, toppings);
        const existing = state.cart.find((item) => item.key === key);

        if (existing) {
            existing.quantity += quantity;
        } else {
            state.cart.push({
                key,
                name: state.currentDish.name,
                price: state.currentDish.price,
                image: state.currentDish.image,
                quantity,
                toppings
            });
        }

        saveCart();
        updateCartCount();
        showToast(`${state.currentDish.name} added to cart.`);
        closeModal();
    };

    const handleCartPageActions = (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const cartItem = button.closest('.cart-page-item');
        if (!cartItem) return;

        const index = Number(cartItem.dataset.index);
        if (Number.isNaN(index)) return;

        if (button.classList.contains('qty-decrease')) {
            if (state.cart[index].quantity > 1) {
                state.cart[index].quantity -= 1;
            } else {
                state.cart.splice(index, 1);
            }
        } else if (button.classList.contains('qty-increase')) {
            state.cart[index].quantity += 1;
        } else if (button.classList.contains('cart-page-item-remove')) {
            state.cart.splice(index, 1);
            showToast('Item removed from cart.', 'error');
        }

        saveCart();
        updateCartCount();
        renderCartPage();
    };

    const filterMenu = (query) => {
        const normalized = query.trim().toLowerCase();
        let visibleCount = 0;

        // clear previous highlights
        elements.cards.forEach((c) => c.classList.remove('highlight'));

        const matches = [];
        elements.cards.forEach((card) => {
            const data = getCardData(card);
            const isVisible = normalized.length > 0 ? (data.name.toLowerCase().includes(normalized) || data.desc.toLowerCase().includes(normalized)) : true;
            card.hidden = !isVisible;
            if (isVisible) {
                visibleCount += 1;
                if (normalized.length > 0) matches.push(card);
            }
        });

        // only show empty message if user typed something and no matches
        if (normalized.length > 0) {
            elements.menuEmpty.hidden = visibleCount !== 0;
        } else {
            elements.menuEmpty.hidden = true;
        }

        if (matches.length > 0) {
            // highlight matches and scroll to first
            const first = matches[0];
            first.classList.add('highlight');
            first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // remove highlight after short delay
            window.setTimeout(() => first.classList.remove('highlight'), 1800);
        }
    };

    const activateScrollAnimations = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18 });

        elements.sections.forEach((section) => observer.observe(section));
    };

    const initEventListeners = () => {
        if (elements.navToggle) {
            elements.navToggle.addEventListener('click', () => {
                const isOpen = elements.nav.classList.toggle('open');
                elements.navToggle.setAttribute('aria-expanded', String(isOpen));
                if (isOpen) {
                    setOverlay(true);
                    state.activeOverlay = 'nav';
                } else {
                    setOverlay(false);
                    state.activeOverlay = null;
                }
            });
        }

        document.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                closeNav();
            });
        });

        elements.cartToggle?.addEventListener('click', showCartPage);
        elements.cartPageBack?.addEventListener('click', hideCartPage);
        elements.cartPageContinue?.addEventListener('click', hideCartPage);
        elements.cartPageEmptyBrowse?.addEventListener('click', hideCartPage);
        elements.overlay?.addEventListener('click', closeActive);

        elements.cards.forEach((card) => {
            const button = card.querySelector('.card-order');
            button?.addEventListener('click', (event) => {
                event.stopPropagation();
                openModal(getCardData(card));
            });
        });

        const orderBtn = document.getElementById('orderBtn');
        orderBtn?.addEventListener('click', () => {
            const menuSection = document.getElementById('menu');
            if (menuSection) {
                menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        elements.modalClose?.addEventListener('click', closeModal);
        elements.orderModal?.addEventListener('click', (event) => {
            if (event.target === elements.orderModal) closeModal();
        });

        elements.qtyMinus?.addEventListener('click', () => {
            elements.orderQuantity.value = Math.max(1, Number(elements.orderQuantity.value) - 1);
            updateOrderTotal();
        });

        elements.qtyPlus?.addEventListener('click', () => {
            elements.orderQuantity.value = Number(elements.orderQuantity.value) + 1;
            updateOrderTotal();
        });

        elements.orderQuantity?.addEventListener('input', () => {
            if (Number(elements.orderQuantity.value) < 1 || !elements.orderQuantity.value) {
                elements.orderQuantity.value = 1;
            }
            updateOrderTotal();
        });

        elements.toppingInputs.forEach((input) => input.addEventListener('change', updateOrderTotal));
        elements.confirmOrder?.addEventListener('click', addToCart);
        elements.menuSearch?.addEventListener('input', (event) => filterMenu(event.target.value));
        elements.cartPageItemsList?.addEventListener('click', handleCartPageActions);
        elements.cartPageCheckout?.addEventListener('click', () => showToast('Proceeding to checkout...', 'success'));

        elements.orderModal?.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeModal();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeActive();
        });

        const contactForm = document.getElementById('contactForm');
        contactForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            showToast('Thanks for reaching out! We will reply soon.');
            contactForm.reset();
        });
    };

    loadCart();
    updateCartCount();
    initEventListeners();
    activateScrollAnimations();
});
