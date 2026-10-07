// Visto en clase :)
const botonPrueba = document.querySelector<HTMLButtonElement>("#boton-prueba");
const mensajePrueba = document.querySelector<HTMLParagraphElement>("#mensaje-prueba");
if (botonPrueba !== null && mensajePrueba !== null) {
    botonPrueba.addEventListener("click", () => {
        mensajePrueba.textContent = "¡La conexión funciona!";
    });
}


interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

type StockStatus = "En stock" | "Bajo stock" | "Sin stock";
type ViewMode = "table" | "grid";

interface Filters {
  search: string;
  category: string;
  stockStatus: "Todos" | StockStatus;
  maxPrice: number;
}

declare const lucide: { createIcons: () => void };

const STORAGE_KEY = "stock_productos";

let products: Product[] = loadProducts();
let viewMode: ViewMode = "table";
const filters: Filters = { search: "", category: "", stockStatus: "Todos", maxPrice: 1000 };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const form = $<HTMLFormElement>("product-form");
const inputId = $<HTMLInputElement>("product-id");
const inputName = $<HTMLInputElement>("product-name");
const inputCategory = $<HTMLInputElement>("product-category");
const inputPrice = $<HTMLInputElement>("product-price");
const inputStock = $<HTMLInputElement>("product-stock");
const btnCancel = $<HTMLButtonElement>("btn-cancel");

function loadProducts(): Product[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Product[]) : [];
}

function saveProducts(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return "Sin stock";
  if (stock <= 5) return "Bajo stock";
  return "En stock";
}

function getFilteredProducts(): Product[] {
  const term = filters.search.toLowerCase();
  return products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
    const matchCategory = !filters.category || p.category === filters.category;
    const matchStatus =
      filters.stockStatus === "Todos" || getStockStatus(p.stock) === filters.stockStatus;
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

function addProduct(data: Omit<Product, "id">): void {
  products.push({ id: Date.now().toString(), ...data });
}

function updateProduct(id: string, data: Omit<Product, "id">): void {
  products = products.map((p) => (p.id === id ? { id, ...data } : p));
}

function deleteProduct(id: string): void {
  products = products.filter((p) => p.id !== id);
}

function renderKpis(): void {
  const k = calculateKpis();
  $("total-products-kpi").textContent = String(k.total);
  $("total-value-kpi").textContent = `$${k.value.toFixed(2)}`;
  $("total-stock-kpi").textContent = `${k.stock} unids.`;
  $("alert-stock-kpi").textContent = String(k.alerts);
}

function renderCategories(): void {
  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  $("category-options").innerHTML = categories.map((c) => `<option value="${c}">`).join("");
  $<HTMLSelectElement>("filter-category").innerHTML =
    `<option value="">Todas las categorías</option>` +
    categories.map((c) => `<option value="${c}">${c}</option>`).join("");
  $<HTMLSelectElement>("filter-category").value = filters.category;
}

function renderTable(list: Product[]): void {
  $("product-table-body").innerHTML = list
    .map(
      (p) => `
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
    </tr>`
    )
    .join("");
}

function renderGrid(list: Product[]): void {
  $("grid-container").innerHTML = list
    .map(
      (p) => `
    <div class="card">
      <h3>${p.name}</h3>
      <p>${p.category}</p>
      <p>$${p.price.toFixed(2)} · ${p.stock} unids. · ${getStockStatus(p.stock)}</p>
      <button data-action="edit" data-id="${p.id}"><i data-lucide="pencil"></i></button>
      <button data-action="delete" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
    </div>`
    )
    .join("");
}

function renderProducts(): void {
  const list = getFilteredProducts();
  $("results-count").textContent = `Mostrando ${list.length} productos`;
  $("empty-state").classList.toggle("hidden", list.length > 0);
  $("table-container").classList.toggle("hidden", viewMode !== "table" || list.length === 0);
  $("grid-container").classList.toggle("hidden", viewMode !== "grid" || list.length === 0);

  if (viewMode === "table") renderTable(list);
  else renderGrid(list);

  lucide.createIcons();
}

function render(): void {
  renderKpis();
  renderCategories();
  renderProducts();
}

function startEdit(id: string): void {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  inputId.value = p.id;
  inputName.value = p.name;
  inputCategory.value = p.category;
  inputPrice.value = String(p.price);
  inputStock.value = String(p.stock);
  $("form-title").textContent = "Editar Producto";
  $("btn-text").textContent = "Guardar Cambios";
  btnCancel.classList.remove("hidden");
}

function resetForm(): void {
  form.reset();
  inputId.value = "";
  $("form-title").textContent = "Agregar Producto";
  $("btn-text").textContent = "Agregar Producto";
  btnCancel.classList.add("hidden");
}

function showToast(message: string): void {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  $("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function onSubmit(e: Event): void {
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
  } else {
    addProduct(data);
    showToast("Producto agregado");
  }

  saveProducts();
  resetForm();
  render();
}

function onTableOrGridClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (!id) return;

  if (action === "edit") startEdit(id);
  if (action === "delete" && confirm("¿Eliminar este producto?")) {
    deleteProduct(id);
    saveProducts();
    render();
    showToast("Producto eliminado");
  }
}

function onFilterChange(): void {
  filters.search = $<HTMLInputElement>("filter-search").value;
  filters.category = $<HTMLSelectElement>("filter-category").value;
  filters.stockStatus = $<HTMLSelectElement>("filter-stock-status").value as Filters["stockStatus"];
  filters.maxPrice = Number($<HTMLInputElement>("filter-max-price").value);
  $("max-price-display").textContent = `$${filters.maxPrice}`;
  renderProducts();
}

function onResetFilters(): void {
  $<HTMLInputElement>("filter-search").value = "";
  $<HTMLSelectElement>("filter-category").value = "";
  $<HTMLSelectElement>("filter-stock-status").value = "Todos";
  $<HTMLInputElement>("filter-max-price").value = "1000";
  onFilterChange();
}

function setView(mode: ViewMode): void {
  viewMode = mode;
  $("view-table-btn").classList.toggle("active", mode === "table");
  $("view-grid-btn").classList.toggle("active", mode === "grid");
  renderProducts();
}

function init(): void {
  form.addEventListener("submit", onSubmit);
  btnCancel.addEventListener("click", resetForm);

  $("product-table-body").addEventListener("click", onTableOrGridClick);
  $("grid-container").addEventListener("click", onTableOrGridClick);

  ["filter-search", "filter-category", "filter-stock-status", "filter-max-price"].forEach((id) =>
    $(id).addEventListener("input", onFilterChange)
  );
  $("btn-reset-filters").addEventListener("click", onResetFilters);
  $("view-table-btn").addEventListener("click", () => setView("table"));
  $("view-grid-btn").addEventListener("click", () => setView("grid"));

  lucide.createIcons();
  render();
  onFilterChange();
}

document.addEventListener("DOMContentLoaded", init);