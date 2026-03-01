// =============================================
//  JACK'S MORGAN POS - UPGRADED SCRIPT
// =============================================

let total = 0;
let menuChart = null;
let paymentChart = null;

// ---- DATA ----
let keranjang = JSON.parse(localStorage.getItem("keranjang")) || {};

let laporan = JSON.parse(localStorage.getItem("laporan")) || {
    bailaChocoIce:  { qty: 0, subtotal: 0 },
    bailaChocoHot:  { qty: 0, subtotal: 0 },
    icelandyLychee: { qty: 0, subtotal: 0 },
    totalQty: 0,
    cash:  { total: 0, transaksi: 0 },
    qris:  { total: 0, transaksi: 0 },
    omzet: 0
};

let riwayatTransaksi = JSON.parse(localStorage.getItem("riwayatTransaksi")) || [];

// ---- LOGIN ----
let currentUser = localStorage.getItem("currentUser") || null;
const users = {
    Arkhan:  { pin: "123", role: "Kasir" },
    Naufal:  { pin: "123", role: "Kasir" },
    Alzam:   { pin: "123", role: "Kasir" },
    Haidar:  { pin: "123", role: "Kasir" },
    Fachry:  { pin: "123", role: "Kasir" }
};

// ---- MENU MAPPING ----
const menuKey = {
    "BAILA'S CHOCO ICE":   "bailaChocoIce",
    "BAILA'S CHOCO HOT":   "bailaChocoHot",
    "ICELANDY LYCHEE":     "icelandyLychee"
};

// =============================================
//  LOGIN / LOGOUT
// =============================================
function login() {
    const username = document.getElementById("username").value.trim();
    const pin = document.getElementById("pin").value;
    if (users[username] && users[username].pin === pin) {
        currentUser = username;
        localStorage.setItem("currentUser", username);
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("mainApp").style.display = "flex";
        initApp();
    } else {
        shakeLoginCard();
    }
}

function shakeLoginCard() {
    const card = document.querySelector(".login-card");
    card.classList.add("shake");
    setTimeout(() => card.classList.remove("shake"), 600);
}

function logout() {
    if (!confirm("Yakin ingin logout?")) return;
    localStorage.removeItem("currentUser");
    location.reload();
}

function initApp() {
    // Set user info
    if (currentUser) {
        document.getElementById("userDisplay").textContent = currentUser;
        document.getElementById("userRole").textContent = users[currentUser]?.role || "Kasir";
        document.getElementById("userAvatar").textContent = currentUser[0].toUpperCase();
    }
    renderTable();
    updateLaporan();
    renderRiwayat();
    updateHeaderStats();
    updateDatetime();
    setInterval(updateDatetime, 1000);
    document.getElementById("laporanDate").textContent = new Date().toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
}

// =============================================
//  DATETIME
// =============================================
function updateDatetime() {
    const el = document.getElementById("currentDatetime");
    if (el) {
        el.textContent = new Date().toLocaleString("id-ID", {
            weekday: "long", day: "numeric", month: "long",
            year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    }
}

// =============================================
//  TABS
// =============================================
// Sync mobile bottom nav active state
function setMobileActive(btn) {
    document.querySelectorAll(".mob-nav-item").forEach(n => n.classList.remove("active"));
    btn.classList.add("active");
}

function switchTab(tab, btn) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    // sync sidebar nav (desktop)
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    // find matching sidebar nav item and activate it
    const matchSidebar = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (matchSidebar) matchSidebar.classList.add("active");
    // find matching mobile nav item and activate it
    const matchMobile = document.querySelector(`.mob-nav-item[data-tab="${tab}"]`);
    if (matchMobile) document.querySelectorAll(".mob-nav-item").forEach(n => n.classList.remove("active"));
    if (matchMobile) matchMobile.classList.add("active");

    document.getElementById("tab-" + tab).classList.add("active");

    if (tab === "laporan") {
        setTimeout(() => {
            renderCharts();
            renderDetailTable();
        }, 100);
    }
    if (tab === "riwayat") {
        renderRiwayat();
    }
}

// =============================================
//  FORMAT HELPERS
// =============================================
function formatRupiah(angka) {
    if (isNaN(angka) || angka === null || angka === undefined) angka = 0;
    angka = parseInt(angka);
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseRupiah(str) {
    if (!str) return 0;
    return parseInt(str.replace(/\./g, "")) || 0;
}

// =============================================
//  KERANJANG / CART
// =============================================
function tambahItem(nama, harga) {
    if (!keranjang[nama]) keranjang[nama] = { harga, qty: 0 };
    keranjang[nama].qty++;
    renderTable();
    saveData();
    // Reset kembalian
    document.getElementById("kembalian").textContent = "0";
}

function kurangiItem(nama) {
    if (!keranjang[nama]) return;
    keranjang[nama].qty--;
    if (keranjang[nama].qty <= 0) delete keranjang[nama];
    renderTable();
    saveData();
}

function hapusItem(nama) {
    delete keranjang[nama];
    renderTable();
    saveData();
}

function renderTable() {
    const tbody = document.getElementById("daftarBelanja");
    const cartEmpty = document.getElementById("cartEmpty");
    const cartTable = document.getElementById("cartTable");
    const cartTotal = document.getElementById("cartTotal");

    if (!tbody) return;
    tbody.innerHTML = "";
    total = 0;

    const items = Object.keys(keranjang);

    if (items.length === 0) {
        cartEmpty.style.display = "flex";
        cartTable.style.display = "none";
        cartTotal.style.display = "none";
    } else {
        cartEmpty.style.display = "none";
        cartTable.style.display = "table";
        cartTotal.style.display = "flex";

        items.forEach(nama => {
            const item = keranjang[nama];
            const sub = item.harga * item.qty;
            total += sub;

            const escapedNama = nama.replace(/'/g, "\\'");
            const row = tbody.insertRow();
            row.innerHTML = `
                <td class="td-menu">${nama}</td>
                <td>Rp ${formatRupiah(item.harga)}</td>
                <td class="td-qty">
                    <button class="qty-btn" onclick="kurangiItem('${escapedNama}')">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" onclick="tambahItem('${escapedNama}',${item.harga})">+</button>
                </td>
                <td>Rp ${formatRupiah(sub)}</td>
                <td><button class="delete-btn" onclick="hapusItem('${escapedNama}')">✕</button></td>
            `;
        });

        document.getElementById("total").textContent = formatRupiah(total);
    }
}

// =============================================
//  QUICK CASH
// =============================================
function setQuickCash(amount) {
    const input = document.getElementById("uangBayar");
    input.value = formatRupiah(amount);
}

// =============================================
//  PAYMENT
// =============================================
function bayar() {
    if (Object.keys(keranjang).length === 0) {
        showToast("⚠️ Keranjang kosong!", "warning");
        return;
    }
    const uang = parseRupiah(document.getElementById("uangBayar").value);
    if (isNaN(uang) || uang < total) {
        showToast("⚠️ Uang tidak cukup!", "warning");
        return;
    }
    const kembali = uang - total;
    prosesLaporan("CASH");
    const snap = JSON.parse(JSON.stringify(keranjang));
    simpanRiwayat(snap, total, "CASH", uang, kembali);
    generateStruk(uang, kembali, snap, "CASH");

    document.getElementById("kembalian").textContent = formatRupiah(kembali);
    keranjang = {};
    renderTable();
    saveData();
    updateLaporan();
    updateHeaderStats();
    document.getElementById("uangBayar").value = "";
    showToast("✅ Pembayaran berhasil!", "success");
}

function konfirmasiQRIS() {
    if (Object.keys(keranjang).length === 0) {
        showToast("⚠️ Keranjang kosong!", "warning");
        return;
    }
    prosesLaporan("QRIS");
    const snap = JSON.parse(JSON.stringify(keranjang));
    simpanRiwayat(snap, total, "QRIS", total, 0);
    generateStruk(total, 0, snap, "QRIS");

    keranjang = {};
    renderTable();
    saveData();
    updateLaporan();
    updateHeaderStats();

    document.getElementById("qrisSection").style.display = "none";
    document.getElementById("cashSection").style.display = "block";
    document.querySelector('input[name="metode"][value="cash"]').checked = true;
    showToast("✅ Pembayaran QRIS berhasil!", "success");
}

// =============================================
//  LAPORAN
// =============================================
function prosesLaporan(metode) {
    for (let nama in keranjang) {
        const item = keranjang[nama];
        laporan.totalQty += item.qty;
        const key = menuKey[nama];
        if (key && laporan[key]) {
            laporan[key].qty += item.qty;
            laporan[key].subtotal += item.harga * item.qty;
        }
    }
    laporan.omzet += total;
    if (metode === "CASH") {
        laporan.cash.total += total;
        laporan.cash.transaksi++;
    } else {
        laporan.qris.total += total;
        laporan.qris.transaksi++;
    }
}

function updateLaporan() {
    document.getElementById("lapOmzet").textContent = "Rp " + formatRupiah(laporan.omzet);
    document.getElementById("lapTotalQty").textContent = laporan.totalQty;
    document.getElementById("lapCash").textContent = laporan.cash.transaksi + " Trx";
    document.getElementById("lapCashAmt").textContent = "Rp " + formatRupiah(laporan.cash.total);
    document.getElementById("lapQris").textContent = laporan.qris.transaksi + " Trx";
    document.getElementById("lapQrisAmt").textContent = "Rp " + formatRupiah(laporan.qris.total);
}

function updateHeaderStats() {
    document.getElementById("headerOmzet").textContent = "Rp " + formatRupiah(laporan.omzet);
    const totalTrx = laporan.cash.transaksi + laporan.qris.transaksi;
    document.getElementById("headerTrx").textContent = totalTrx;
}

// =============================================
//  CHARTS
// =============================================
function renderCharts() {
    renderMenuChart();
    renderPaymentChart();
}

function renderMenuChart() {
    const ctx = document.getElementById("menuChart");
    if (!ctx) return;

    const labels = ["Choco Ice", "Choco Hot", "Lychee"];
    const keys   = ["bailaChocoIce", "bailaChocoHot", "icelandyLychee"];
    const data   = keys.map(k => laporan[k]?.qty || 0);

    if (menuChart) menuChart.destroy();
    menuChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Cup Terjual",
                data,
                backgroundColor: [
                    "rgba(99,102,241,0.8)",
                    "rgba(239,68,68,0.8)",
                    "rgba(16,185,129,0.8)"
                ],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: "rgba(255,255,255,0.05)" },
                    ticks: { color: "rgba(255,255,255,0.6)", font: { family: "DM Sans", size: 11 } }
                },
                y: {
                    grid: { color: "rgba(255,255,255,0.05)" },
                    ticks: {
                        color: "rgba(255,255,255,0.6)",
                        font: { family: "DM Sans", size: 11 },
                        stepSize: 1
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function renderPaymentChart() {
    const ctx = document.getElementById("paymentChart");
    if (!ctx) return;

    if (paymentChart) paymentChart.destroy();
    const cashVal = laporan.cash.total;
    const qrisVal = laporan.qris.total;

    if (cashVal === 0 && qrisVal === 0) {
        ctx.parentElement.innerHTML = `<div class="chart-empty">Belum ada transaksi</div>`;
        return;
    }

    paymentChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Cash", "QRIS"],
            datasets: [{
                data: [cashVal, qrisVal],
                backgroundColor: ["rgba(34,197,94,0.85)", "rgba(59,130,246,0.85)"],
                borderColor: ["rgba(34,197,94,1)", "rgba(59,130,246,1)"],
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "rgba(255,255,255,0.7)",
                        padding: 20,
                        font: { family: "DM Sans", size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => " Rp " + formatRupiah(ctx.parsed)
                    }
                }
            }
        }
    });
}

function renderDetailTable() {
    const tbody = document.getElementById("detailMenuBody");
    if (!tbody) return;

    const menuItems = [
        { label: "Baila's Choco Ice",  key: "bailaChocoIce" },
        { label: "Baila's Choco Hot",  key: "bailaChocoHot" },
        { label: "Icelandy Lychee",    key: "icelandyLychee" }
    ];

    tbody.innerHTML = "";
    menuItems.forEach(item => {
        const data = laporan[item.key];
        const share = laporan.totalQty > 0 ? Math.round(data.qty / laporan.totalQty * 100) : 0;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.label}</td>
            <td>${data.qty} cup</td>
            <td>Rp ${formatRupiah(data.subtotal)}</td>
            <td>
                <div class="share-bar">
                    <div class="share-fill" style="width:${share}%"></div>
                    <span>${share}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// =============================================
//  RIWAYAT TRANSAKSI
// =============================================
function simpanRiwayat(items, jumlah, metode, bayar, kembali) {
    const now = new Date();
    const trx = {
        id: "TRX" + now.getTime(),
        tanggal: now.toLocaleDateString("id-ID"),
        waktu: now.toLocaleTimeString("id-ID"),
        items,
        total: jumlah,
        metode,
        bayar,
        kembali,
        kasir: currentUser
    };
    riwayatTransaksi.unshift(trx);
    localStorage.setItem("riwayatTransaksi", JSON.stringify(riwayatTransaksi));

    // Update badge (sidebar + mobile)
    const badge = document.getElementById("historyBadge");
    if (badge) badge.textContent = riwayatTransaksi.length;
    const mobBadge = document.getElementById("mobHistoryBadge");
    if (mobBadge) {
        mobBadge.textContent = riwayatTransaksi.length;
        mobBadge.style.display = riwayatTransaksi.length > 0 ? "flex" : "none";
    }
}

function renderRiwayat(filter = "all") {
    const container = document.getElementById("riwayatList");
    if (!container) return;

    const badge = document.getElementById("historyBadge");
    if (badge) badge.textContent = riwayatTransaksi.length;
    const mobBadge2 = document.getElementById("mobHistoryBadge");
    if (mobBadge2) {
        mobBadge2.textContent = riwayatTransaksi.length;
        mobBadge2.style.display = riwayatTransaksi.length > 0 ? "flex" : "none";
    }

    const filtered = filter === "all"
        ? riwayatTransaksi
        : riwayatTransaksi.filter(t => t.metode.toLowerCase() === filter);

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>Belum ada transaksi</p></div>`;
        return;
    }

    container.innerHTML = filtered.map(trx => {
        const itemsList = Object.values(trx.items).map(it => `${it.qty}x ${Object.keys(trx.items).find(k => trx.items[k] === it)}`).join(", ");
        const methodClass = trx.metode === "CASH" ? "badge-cash" : "badge-qris";
        return `
        <div class="riwayat-item" onclick="lihatStrukRiwayat('${trx.id}')">
            <div class="riwayat-left">
                <div class="riwayat-id">${trx.id}</div>
                <div class="riwayat-items">${itemsList}</div>
                <div class="riwayat-meta">${trx.tanggal} · ${trx.waktu} · ${trx.kasir}</div>
            </div>
            <div class="riwayat-right">
                <div class="riwayat-total">Rp ${formatRupiah(trx.total)}</div>
                <span class="pay-badge ${methodClass}">${trx.metode}</span>
            </div>
        </div>`;
    }).join("");
}

function filterRiwayat(filter, btn) {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderRiwayat(filter);
}

function lihatStrukRiwayat(id) {
    const trx = riwayatTransaksi.find(t => t.id === id);
    if (!trx) return;
    generateStruk(trx.bayar, trx.kembali, trx.items, trx.metode, trx.id, trx.waktu);
}

function exportRiwayat() {
    if (riwayatTransaksi.length === 0) {
        showToast("Belum ada transaksi!", "warning");
        return;
    }
    tutupKasir();
}

// =============================================
//  STRUK
// =============================================
function generateStruk(uang, kembali, data, metode, noTrx, waktuOverride) {
    const now = new Date();
    const tanggal = now.toLocaleDateString("id-ID");
    const jam = waktuOverride || now.toLocaleTimeString("id-ID");
    const nomorTransaksi = noTrx || ("TRX" + Date.now());

    document.getElementById("strukturNoTrx").textContent = nomorTransaksi;
    document.getElementById("strukWaktu").textContent = tanggal + " " + jam;
    document.getElementById("strukKasir").textContent = currentUser || "-";

    let subtotal = 0;
    let itemsHTML = "";
    for (let nama in data) {
        const item = data[nama];
        const sub = item.harga * item.qty;
        subtotal += sub;
        itemsHTML += `
            <div class="struk-item-row">
                <div>
                    <div class="struk-item-name">${nama}</div>
                    <div class="struk-item-sub">@ Rp ${formatRupiah(item.harga)} × ${item.qty}</div>
                </div>
                <div class="struk-item-price">Rp ${formatRupiah(sub)}</div>
            </div>`;
    }

    let totalsHTML = `
        <div class="struk-total-row">
            <span>Subtotal</span><span>Rp ${formatRupiah(subtotal)}</span>
        </div>`;
    if (metode === "CASH") {
        totalsHTML += `
            <div class="struk-total-row">
                <span>Tunai</span><span>Rp ${formatRupiah(uang)}</span>
            </div>
            <div class="struk-total-row">
                <span>Kembali</span><span>Rp ${formatRupiah(kembali)}</span>
            </div>`;
    }
    totalsHTML += `
        <div class="struk-total-row grand">
            <span>TOTAL</span><span>Rp ${formatRupiah(subtotal)}</span>
        </div>
        <div class="struk-metode">
            <span class="pay-badge ${metode === 'CASH' ? 'badge-cash' : 'badge-qris'}">${metode}</span>
        </div>`;

    document.getElementById("strukItems").innerHTML = itemsHTML;
    document.getElementById("strukTotals").innerHTML = totalsHTML;
    document.getElementById("strukModal").style.display = "flex";
}

function tutupStruk() {
    document.getElementById("strukModal").style.display = "none";
}

// =============================================
//  RESET & EXPORT
// =============================================
function resetLaporan() {
    if (!confirm("Reset semua data laporan hari ini? Riwayat transaksi juga akan dihapus.")) return;
    laporan = {
        bailaChocoIce:  { qty: 0, subtotal: 0 },
        bailaChocoHot:  { qty: 0, subtotal: 0 },
        icelandyLychee: { qty: 0, subtotal: 0 },
        totalQty: 0,
        cash:  { total: 0, transaksi: 0 },
        qris:  { total: 0, transaksi: 0 },
        omzet: 0
    };
    riwayatTransaksi = [];
    saveData();
    updateLaporan();
    updateHeaderStats();
    renderRiwayat();
    if (menuChart) { menuChart.destroy(); menuChart = null; }
    if (paymentChart) { paymentChart.destroy(); paymentChart = null; }
    showToast("✅ Laporan berhasil direset", "success");
}

function tutupKasir() {
    if (laporan.omzet === 0) {
        showToast("Belum ada transaksi!", "warning");
        return;
    }
    const dateStr = new Date().toLocaleDateString("id-ID");
    const filename = `Laporan_JacksMorgan_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Sheet 1: Laporan
    let dataLap = [
        ["LAPORAN PENJUALAN HARIAN - JACK'S MORGAN"],
        ["Tanggal:", dateStr],
        [],
        ["REKAP PENJUALAN MENU"],
        ["Nama Menu", "Qty Terjual", "Total (Rp)"],
        ["Baila's Choco Ice",   laporan.bailaChocoIce.qty,    laporan.bailaChocoIce.subtotal],
        ["Baila's Choco Hot",   laporan.bailaChocoHot.qty,    laporan.bailaChocoHot.subtotal],
        ["Icelandy Lychee",     laporan.icelandyLychee.qty,   laporan.icelandyLychee.subtotal],
        ["TOTAL CUP",           laporan.totalQty,             ""],
        [],
        ["REKAP PEMBAYARAN"],
        ["Metode", "Transaksi", "Total (Rp)"],
        ["Cash", laporan.cash.transaksi, laporan.cash.total],
        ["QRIS", laporan.qris.transaksi, laporan.qris.total],
        ["TOTAL OMZET", "", laporan.omzet]
    ];

    // Sheet 2: Riwayat
    let dataRiwayat = [["No", "ID Transaksi", "Tanggal", "Waktu", "Kasir", "Items", "Total", "Metode"]];
    riwayatTransaksi.forEach((trx, i) => {
        const items = Object.entries(trx.items).map(([k, v]) => `${v.qty}x ${k}`).join(", ");
        dataRiwayat.push([i + 1, trx.id, trx.tanggal, trx.waktu, trx.kasir, items, trx.total, trx.metode]);
    });

    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4472C4" } }, alignment: { horizontal: "center" } };

    const wsLap = XLSX.utils.aoa_to_sheet(dataLap);
    wsLap["A1"].s = { font: { bold: true, sz: 14 } };
    wsLap["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 22 }];
    ["A5","B5","C5"].forEach(c => { if(wsLap[c]) wsLap[c].s = headerStyle; });
    ["A14","B14","C14"].forEach(c => { if(wsLap[c]) wsLap[c].s = headerStyle; });

    const wsRiw = XLSX.utils.aoa_to_sheet(dataRiwayat);
    wsRiw["!cols"] = [{ wch: 5 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 50 }, { wch: 15 }, { wch: 8 }];
    ["A1","B1","C1","D1","E1","F1","G1","H1"].forEach(c => { if(wsRiw[c]) wsRiw[c].s = headerStyle; });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsLap, "Laporan");
    XLSX.utils.book_append_sheet(wb, wsRiw, "Riwayat Transaksi");
    XLSX.writeFile(wb, filename);
    showToast("✅ File Excel berhasil diexport!", "success");
}

// =============================================
//  SAVE DATA
// =============================================
function saveData() {
    localStorage.setItem("keranjang", JSON.stringify(keranjang));
    localStorage.setItem("laporan", JSON.stringify(laporan));
    localStorage.setItem("riwayatTransaksi", JSON.stringify(riwayatTransaksi));
}

// =============================================
//  TOAST NOTIFICATION
// =============================================
function showToast(msg, type = "success") {
    let toast = document.getElementById("toastNotif");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastNotif";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = "toast show toast-" + type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// =============================================
//  DOM READY
// =============================================
document.addEventListener("DOMContentLoaded", function () {
    // Check login
    if (currentUser) {
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("mainApp").style.display = "flex";
        initApp();
    } else {
        document.getElementById("mainApp").style.display = "none";
        // Enter key on login
        document.getElementById("pin").addEventListener("keydown", e => {
            if (e.key === "Enter") login();
        });
    }

    // Payment method toggle
    document.querySelectorAll('input[name="metode"]').forEach(r => {
        r.addEventListener("change", function () {
            const isCash = this.value === "cash";
            document.getElementById("cashSection").style.display = isCash ? "block" : "none";
            document.getElementById("qrisSection").style.display = isCash ? "none" : "block";
            document.getElementById("kembalian").textContent = "0";
        });
    });

    // Uang bayar formatter
    const uangInput = document.getElementById("uangBayar");
    if (uangInput) {
        uangInput.addEventListener("input", function (e) {
            let val = e.target.value.replace(/\D/g, "");
            if (val) {
                val = parseInt(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                e.target.value = val;
            } else {
                e.target.value = "";
            }
        });
    }

    // Close struk on overlay click
    document.getElementById("strukModal").addEventListener("click", function (e) {
        if (e.target === this) tutupStruk();
    });
});