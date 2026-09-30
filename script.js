// Base de datos inicial de prueba
const INITIAL_PRODUCTS = [
    { id: '1', name: 'Laptop Pro 15"', category: 'Electrónica', price: 1200.00, stock: 8 },
    { id: '2', name: 'Mouse Inalámbrico', category: 'Accesorios', price: 25.50, stock: 15 },
    { id: '3', name: 'Teclado Mecánico RGB', category: 'Accesorios', price: 85.00, stock: 3 },
    { id: '4', name: 'Monitor 27 4K', category: 'Electrónica', price: 350.00, stock: 0 },
    { id: '5', name: 'Silla Ergonómica', category: 'Muebles', price: 199.99, stock: 12 }
  ];
  
  // Estado global de la app
  let products = JSON.parse(localStorage.getItem('stockpro_products')) || INITIAL_PRODUCTS;
  let currentView = 'table'; // 'table' o 'grid'
  
  // Elementos DOM
  const productForm = document.getElementById('product-form');
  const productIdInput = document.getElementById('product-id');
  const productNameInput = document.getElementById('product-name');
  const productCategoryInput = document.getElementById('product-category');
  const productPriceInput = document.getElementById('product-price');
  const productStockInput = document.getElementById('product-stock');
  const btnSubmit = document.getElementById('btn-submit');
  const btnText = document.getElementById('btn-text');
  const btnCancel = document.getElementById('btn-cancel');
  const formTitle = document.getElementById('form-title');
  
  // Filtros
  const filterSearch = document.getElementById('filter-search');
  const filterCategory = document.getElementById('filter-category');
  const filterStockStatus = document.getElementById('filter-stock-status');
  const filterMaxPrice = document.getElementById('filter-max-price');
  const maxPriceDisplay = document.getElementById('max-price-display');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  
  // Vistas y Contenedores
  const tableContainer = document.getElementById('table-container');
  const gridContainer = document.getElementById('grid-container');
  const productTableBody = document.getElementById('product-table-body');
  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');
  const viewTableBtn = document.getElementById('view-table-btn');
  const viewGridBtn = document.getElementById('view-grid-btn');
  
  // --- INICIALIZACIÓN ---
  document.addEventListener('DOMContentLoaded', () => {
    saveProductsToStorage();
    setupPriceFilterRange();
    renderApp();
    
    // Event Listeners
    productForm.addEventListener('submit', handleFormSubmit);
    btnCancel.addEventListener('click', resetForm);
    
    filterSearch.addEventListener('input', renderApp);
    filterCategory.addEventListener('change', renderApp);
    filterStockStatus.addEventListener('change', renderApp);
    filterMaxPrice.addEventListener('input', (e) => {
      maxPriceDisplay.textContent = `$${parseFloat(e.target.value).toLocaleString()}`;
      renderApp();
    });
    
    btnResetFilters.addEventListener('click', resetFilters);
    viewTableBtn.addEventListener('click', () => switchView('table'));
    viewGridBtn.addEventListener('click', () => switchView('grid'));
  });
  
  // --- PERSISTENCIA Y RENDERIZADO PRINCIPAL ---
  function saveProductsToStorage() {
    localStorage.setItem('stockpro_products', JSON.stringify(products));
  }
  
  function renderApp() {
    updateCategoriesOptions();
    const filtered = getFilteredProducts();
    
    updateKPIs(products);
    renderProducts(filtered);
    
    if (window.lucide) lucide.createIcons();
  }
  
  // Configurar rango máximo en el slider de precios
  function setupPriceFilterRange() {
    if (products.length === 0) return;
    const highestPrice = Math.ceil(Math.max(...products.map(p => p.price)));
    filterMaxPrice.max = highestPrice > 0 ? highestPrice : 1000;
    filterMaxPrice.value = filterMaxPrice.max;
    maxPriceDisplay.textContent = `$${parseFloat(filterMaxPrice.value).toLocaleString()}`;
  }
  
  // Actualizar opciones únicas de categorías
  function updateCategoriesOptions() {
    const categories = [...new Set(products.map(p => p.category))].sort();
    
    // Para el datalist del formulario
    const datalist = document.getElementById('category-options');
    datalist.innerHTML = categories.map(c => `<option value="${c}">`).join('');
  
    // Para el select de filtros
    const currentVal = filterCategory.value;
    filterCategory.innerHTML = '<option value="">Todas las categorías</option>' + 
      categories.map(c => `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`).join('');
  }
  
  // --- BÚSQUEDA Y FILTRADO ---
  function getFilteredProducts() {
    const searchVal = filterSearch.value.toLowerCase().trim();
    const selectedCat = filterCategory.value;
    const stockStatus = filterStockStatus.value;
    const maxPrice = parseFloat(filterMaxPrice.value);
  
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchVal) || p.category.toLowerCase().includes(searchVal);
      const matchesCategory = selectedCat === '' || p.category === selectedCat;
      const matchesPrice = p.price <= maxPrice;
  
      let matchesStock = true;
      if (stockStatus === 'in_stock') matchesStock = p.stock > 5;
      else if (stockStatus === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 5;
      else if (stockStatus === 'out_of_stock') matchesStock = p.stock === 0;
  
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });
  }
  
  function resetFilters() {
    filterSearch.value = '';
    filterCategory.value = '';
    filterStockStatus.value = 'all';
    setupPriceFilterRange();
    renderApp();
    showToast('Filtros limpiados');
  }
  
  // --- ACTUALIZACIÓN DE KPIS ---
  function updateKPIs(allProducts) {
    const totalCount = allProducts.length;
    const totalVal = allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const totalUnits = allProducts.reduce((sum, p) => sum + p.stock, 0);
    const alertsCount = allProducts.filter(p => p.stock <= 5).length;
  
    document.getElementById('total-products-kpi').textContent = totalCount;
    document.getElementById('total-value-kpi').textContent = `$${totalVal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
    document.getElementById('total-stock-kpi').textContent = `${totalUnits} unids.`;
    document.getElementById('alert-stock-kpi').textContent = alertsCount;
  }
  
  // --- MOSTRAR PRODUCTOS EN VISTAS ---
  function renderProducts(items) {
    resultsCount.textContent = `Mostrando ${items.length} de ${products.length} productos`;
  
    if (items.length === 0) {
      tableContainer.classList.add('hidden');
      gridContainer.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }
  
    emptyState.classList.add('hidden');
  
    if (currentView === 'table') {
      tableContainer.classList.remove('hidden');
      gridContainer.classList.add('hidden');
      renderTable(items);
    } else {
      tableContainer.classList.add('hidden');
      gridContainer.classList.remove('hidden');
      renderGrid(items);
    }
  }
  
  function getBadgeHTML(stock) {
    if (stock === 0) return `<span class="badge badge-danger">Sin Stock</span>`;
    if (stock <= 5) return `<span class="badge badge-warning">Bajo Stock</span>`;
    return `<span class="badge badge-success">En Stock</span>`;
  }
  
  function renderTable(items) {
    productTableBody.innerHTML = items.map(p => `
      <tr>
        <td><strong>${escapeHTML(p.name)}</strong></td>
        <td>${escapeHTML(p.category)}</td>
        <td>$${p.price.toFixed(2)}</td>
        <td>
          <div class="stock-control">
            <button class="stock-btn" onclick="adjustStock('${p.id}', -1)">-</button>
            <span>${p.stock}</span>
            <button class="stock-btn" onclick="adjustStock('${p.id}', 1)">+</button>
          </div>
        </td>
        <td>${getBadgeHTML(p.stock)}</td>
        <td class="text-right">
          <div class="action-btns" style="justify-content: flex-end;">
            <button class="btn-icon" onclick="editProduct('${p.id}')" title="Editar"><i data-lucide="edit-3"></i></button>
            <button class="btn-icon delete" onclick="deleteProduct('${p.id}')" title="Eliminar"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  function renderGrid(items) {
    gridContainer.innerHTML = items.map(p => `
      <div class="card product-card">
        <div>
          <div class="product-card-header">
            <span class="product-card-title">${escapeHTML(p.name)}</span>
            ${getBadgeHTML(p.stock)}
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">${escapeHTML(p.category)}</div>
          <div class="product-card-price">$${p.price.toFixed(2)}</div>
        </div>
        <div class="product-card-footer">
          <div class="stock-control">
            <small>Stock: </small>
            <button class="stock-btn" onclick="adjustStock('${p.id}', -1)">-</button>
            <strong>${p.stock}</strong>
            <button class="stock-btn" onclick="adjustStock('${p.id}', 1)">+</button>
          </div>
          <div class="action-btns">
            <button class="btn-icon" onclick="editProduct('${p.id}')"><i data-lucide="edit-3"></i></button>
            <button class="btn-icon delete" onclick="deleteProduct('${p.id}')"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  // --- GESTIÓN / FORMULARIO ---
  function handleFormSubmit(e) {
    e.preventDefault();
  
    const id = productIdInput.value;
    const name = productNameInput.value.trim();
    const category = productCategoryInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const stock = parseInt(productStockInput.value, 10);
  
    if (!name || !category || isNaN(price) || isNaN(stock)) return;
  
    if (id) {
      // Modo Edición
      products = products.map(p => p.id === id ? { id, name, category, price, stock } : p);
      showToast('Producto actualizado con éxito');
    } else {
      // Modo Creación
      const newProduct = {
        id: Date.now().toString(),
        name,
        category,
        price,
        stock
      };
      products.push(newProduct);
      showToast('Producto agregado con éxito');
    }
  
    saveProductsToStorage();
    resetForm();
    setupPriceFilterRange();
    renderApp();
  }
  
  function editProduct(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;
  
    productIdInput.value = p.id;
    productNameInput.value = p.name;
    productCategoryInput.value = p.category;
    productPriceInput.value = p.price;
    productStockInput.value = p.stock;
  
    formTitle.innerHTML = `<i data-lucide="edit"></i> Editar Producto`;
    btnText.textContent = 'Guardar Cambios';
    btnCancel.classList.remove('hidden');
    
    if (window.lucide) lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  function adjustStock(id, amount) {
    products = products.map(p => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock + amount);
        return { ...p, stock: newStock };
      }
      return p;
    });
    saveProductsToStorage();
    renderApp();
  }
  
  function deleteProduct(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      products = products.filter(p => p.id !== id);
      saveProductsToStorage();
      setupPriceFilterRange();
      renderApp();
      showToast('Producto eliminado');
    }
  }
  
  function resetForm() {
    productIdInput.value = '';
    productForm.reset();
    formTitle.innerHTML = `<i data-lucide="plus-circle"></i> Agregar Producto`;
    btnText.textContent = 'Agregar Producto';
    btnCancel.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
  }
  
  function switchView(view) {
    currentView = view;
    if (view === 'table') {
      viewTableBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
    } else {
      viewGridBtn.classList.add('active');
      viewTableBtn.classList.remove('active');
    }
    renderApp();
  }
  
  // --- UTILIDADES ---
  function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
  
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
  
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }