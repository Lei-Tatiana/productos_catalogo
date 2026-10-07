"use strict";
// Visto en clase :)
const botonPrueba = document.querySelector("#boton-prueba");
const mensajePrueba = document.querySelector("#mensaje-prueba");
if (botonPrueba !== null && mensajePrueba !== null) {
    botonPrueba.addEventListener("click", () => {
        mensajePrueba.textContent = "¡La conexión funciona!";
    });
}
const STORAGE_KEY = "stock_productos";
let products = loadProducts();
let viewMode = "table";
const filters = { search: "", category: "", stockStatus: "Todos", maxPrice: 1000 };
const $ = (id) => document.getElementById(id);
const form = $("product-form");
const inputId = $("product-id");
const inputName = $("product-name");
const inputCategory = $("product-category");
const inputPrice = $("product-price");
const inputStock = $("product-stock");
const btnCancel = $("btn-cancel");
function loadProducts() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}
function saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}
function getStockStatus(stock) {
    if (stock === 0)
        return "Sin stock";
    if (stock <= 5)
        return "Bajo stock";
    return "En stock";
}
function getFilteredProducts() {
    const term = filters.search.toLowerCase();
    return products.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
        const matchCategory = !filters.category || p.category === filters.category;
        const matchStatus = filters.stockStatus === "Todos" || getStockStatus(p.stock) === filters.stockStatus;
        const matchPrice = p.price <= filters.maxPrice;
        return matchSearch && matchCategory && matchStatus && matchPrice;
    });
}
// Lo necesario para funcionar (Lógica y renders)
function calculateKpis() {
    return {
        total: products.length,
        value: products.reduce((sum, p) => sum + p.price * p.stock, 0),
        stock: products.reduce((sum, p) => sum + p.stock, 0),
        alerts: products.filter((p) => p.stock <= 5).length,
    };
}
function addProduct(data) {
    products.push(Object.assign({ id: Date.now().toString() }, data));
}
function updateProduct(id, data) {
    products = products.map((p) => (p.id === id ? Object.assign({ id }, data) : p));
}
function deleteProduct(id) {
    products = products.filter((p) => p.id !== id);
}
function renderKpis() {
    const k = calculateKpis();
    $("total-products-kpi").textContent = String(k.total);
    $("total-value-kpi").textContent = `$${k.value.toFixed(2)}`;
    $("total-stock-kpi").textContent = `${k.stock} unids.`;
    $("alert-stock-kpi").textContent = String(k.alerts);
}
function renderCategories() {
    const categories = Array.from(new Set(products.map((p) => p.category))).sort();
    $("category-options").innerHTML = categories.map((c) => `<option value="${c}">`).join("");
    $("filter-category").innerHTML =
        `<option value="">Todas las categorías</option>` +
            categories.map((c) => `<option value="${c}">${c}</option>`).join("");
    $("filter-category").value = filters.category;
}
function renderTable(list) {
    $("product-table-body").innerHTML = list
        .map((p) => `
    <tr>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>$${p.price.toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>${getStockStatus(p.stock)}</td>
      <td class="text-right">
        <button data-action="edit" data-id="${p.id}"><i data-lucide="pencil"></i></button>
        <button data-action="delete" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
      </td>
    </tr>`)
        .join("");
}
function renderGrid(list) {
    $("grid-container").innerHTML = list
        .map((p) => `
    <div class="card">
      <h3>${p.name}</h3>
      <p>${p.category}</p>
      <p>$${p.price.toFixed(2)} · ${p.stock} unids. · ${getStockStatus(p.stock)}</p>
      <button data-action="edit" data-id="${p.id}"><i data-lucide="pencil"></i></button>
      <button data-action="delete" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
    </div>`)
        .join("");
}
function renderProducts() {
    const list = getFilteredProducts();
    $("results-count").textContent = `Mostrando ${list.length} productos`;
    $("empty-state").classList.toggle("hidden", list.length > 0);
    $("table-container").classList.toggle("hidden", viewMode !== "table" || list.length === 0);
    $("grid-container").classList.toggle("hidden", viewMode !== "grid" || list.length === 0);
    if (viewMode === "table")
        renderTable(list);
    else
        renderGrid(list);
    lucide.createIcons();
}
function render() {
    renderKpis();
    renderCategories();
    renderProducts();
}
function startEdit(id) {
    const p = products.find((x) => x.id === id);
    if (!p)
        return;
    inputId.value = p.id;
    inputName.value = p.name;
    inputCategory.value = p.category;
    inputPrice.value = String(p.price);
    inputStock.value = String(p.stock);
    $("form-title").textContent = "Editar Producto";
    $("btn-text").textContent = "Guardar Cambios";
    btnCancel.classList.remove("hidden");
}
function resetForm() {
    form.reset();
    inputId.value = "";
    $("form-title").textContent = "Agregar Producto";
    $("btn-text").textContent = "Agregar Producto";
    btnCancel.classList.add("hidden");
}
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    $("toast-container").appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
function onSubmit(e) {
    e.preventDefault();
    const data = {
        name: inputName.value.trim(),
        category: inputCategory.value.trim(),
        price: parseFloat(inputPrice.value),
        stock: parseInt(inputStock.value, 10),
    };
    if (inputId.value) {
        updateProduct(inputId.value, data);
        showToast("Producto actualizado");
    }
    else {
        addProduct(data);
        showToast("Producto agregado");
    }
    saveProducts();
    resetForm();
    render();
}
function onTableOrGridClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn)
        return;
    const { action, id } = btn.dataset;
    if (!id)
        return;
    if (action === "edit")
        startEdit(id);
    if (action === "delete" && confirm("¿Eliminar este producto?")) {
        deleteProduct(id);
        saveProducts();
        render();
        showToast("Producto eliminado");
    }
}
function onFilterChange() {
    filters.search = $("filter-search").value;
    filters.category = $("filter-category").value;
    filters.stockStatus = $("filter-stock-status").value;
    filters.maxPrice = Number($("filter-max-price").value);
    $("max-price-display").textContent = `$${filters.maxPrice}`;
    renderProducts();
}
function onResetFilters() {
    $("filter-search").value = "";
    $("filter-category").value = "";
    $("filter-stock-status").value = "Todos";
    $("filter-max-price").value = "1000";
    onFilterChange();
}
function setView(mode) {
    viewMode = mode;
    $("view-table-btn").classList.toggle("active", mode === "table");
    $("view-grid-btn").classList.toggle("active", mode === "grid");
    renderProducts();
}
function init() {
    form.addEventListener("submit", onSubmit);
    btnCancel.addEventListener("click", resetForm);
    $("product-table-body").addEventListener("click", onTableOrGridClick);
    $("grid-container").addEventListener("click", onTableOrGridClick);
    ["filter-search", "filter-category", "filter-stock-status", "filter-max-price"].forEach((id) => $(id).addEventListener("input", onFilterChange));
    $("btn-reset-filters").addEventListener("click", onResetFilters);
    $("view-table-btn").addEventListener("click", () => setView("table"));
    $("view-grid-btn").addEventListener("click", () => setView("grid"));
    lucide.createIcons();
    render();
    onFilterChange();
}
document.addEventListener("DOMContentLoaded", init);
