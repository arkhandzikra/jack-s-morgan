let total = 0;

let keranjang = JSON.parse(localStorage.getItem("keranjang")) || {};
let laporan = JSON.parse(localStorage.getItem("laporan")) || {
    chocolateIce: { qty: 0, subtotal: 0 },
    chocolateHot: { qty: 0, subtotal: 0 },
    mojito: { qty: 0, subtotal: 0 },
    totalQty: 0,
    cash: { total: 0, transaksi: 0 },
    qris: { total: 0, transaksi: 0 },
    omzet: 0
};

// ================= LOGIN SYSTEM =================
let currentUser = localStorage.getItem("currentUser") || null;
const users = {
    Arkhan: { pin: "123", role: "KASIR" },
    Naufal: { pin: "123", role: "KASIR" },
    Alzam: { pin: "123", role: "KASIR" },
    Haidar: { pin: "123", role: "KASIR" },
    Fachry: { pin: "123", role: "KASIR" }
};

function login() {
    let username = document.getElementById("username").value;
    let pin = document.getElementById("pin").value;
    if (users[username] && users[username].pin === pin) {
        currentUser = username;
        localStorage.setItem("currentUser", username);
        document.getElementById("loginPage").style.display = "none";
        showUser();
    } else {
        alert("Username atau PIN salah!");
    }
}

function logout() {
    localStorage.removeItem("currentUser");
    location.reload();
}

function showUser() {
    if (currentUser) {
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("userDisplay").innerText = users[currentUser].role + " | " + currentUser;
    }
}

window.addEventListener("load", () => {
    if (currentUser) showUser();
});

function saveData() {
    localStorage.setItem("keranjang", JSON.stringify(keranjang));
    localStorage.setItem("laporan", JSON.stringify(laporan));
}

function formatRupiah(angka) {
    return angka.toLocaleString("id-ID");
}

function resetKembalian() {
    document.getElementById("kembalian").innerText = "0";
}

function tambahItem(nama, harga) {
    resetKembalian();
    if (!keranjang[nama]) {
        keranjang[nama] = { harga: harga, qty: 0 };
    }
    keranjang[nama].qty++;
    renderTable();
    saveData();
}

function kurangiItem(nama) {
    if (keranjang[nama]) {
        keranjang[nama].qty--;
        if (keranjang[nama].qty <= 0) {
            delete keranjang[nama];
        }
        renderTable();
        saveData();
    }
}

function hapusItem(nama) {
    delete keranjang[nama];
    renderTable();
    saveData();
}

function renderTable() {
    let table = document.getElementById("daftarBelanja");
    table.innerHTML = "";
    total = 0;
    for (let nama in keranjang) {
        let item = keranjang[nama];
        let sub = item.harga * item.qty;
        total += sub;
        let row = table.insertRow();
        row.innerHTML = `<td>${nama}</td><td>${formatRupiah(item.harga)}</td>
            <td><button onclick="kurangiItem('${nama}')">-</button> ${item.qty} <button onclick="tambahItem('${nama}',${item.harga})">+</button></td>
            <td>${formatRupiah(sub)}</td><td><button class="delete-btn" onclick="hapusItem('${nama}')">🗑</button></td>`;
    }
    document.getElementById("total").innerText = formatRupiah(total);
}

function bayar() {
    if (Object.keys(keranjang).length === 0) return alert("Keranjang kosong!");
    let input = document.getElementById("uangBayar").value.replace(/\D/g, "");
    let uang = parseInt(input);
    if (uang >= total) {
        let kembali = uang - total;
        prosesLaporan("CASH");
        generateStruk(uang, kembali, JSON.parse(JSON.stringify(keranjang)), "CASH");
        document.getElementById("kembalian").innerText = formatRupiah(kembali);
        keranjang = {};
        renderTable();
        saveData();
        updateLaporan();
        document.getElementById("uangBayar").value = "";
    } else {
        alert("Uang tidak cukup!");
    }
}

function konfirmasiQRIS() {
    if (Object.keys(keranjang).length === 0) {
        alert("Keranjang belanja masih kosong!");
        return;
    }
    
    // Animasi tombol
    const btn = event.target;
    btn.style.transform = "scale(0.95)";
    setTimeout(() => {
        btn.style.transform = "";
    }, 200);
    
    prosesLaporan("QRIS");
    generateStruk(total, 0, JSON.parse(JSON.stringify(keranjang)), "QRIS");
    keranjang = {};
    renderTable();
    saveData();
    updateLaporan();
    document.getElementById("qrisSection").style.display = "none";
    
    // Reset ke metode Cash
    document.querySelector('input[name="metode"][value="cash"]').checked = true;
    document.getElementById("uangBayar").style.display = "block";
}

function prosesLaporan(metode) {
    for (let nama in keranjang) {
        let item = keranjang[nama];
        laporan.totalQty += item.qty;
        if (nama === "Chocolate Ice") {
            laporan.chocolateIce.qty += item.qty;
            laporan.chocolateIce.subtotal += (item.harga * item.qty);
        }
        if (nama === "Chocolate Hot") {
            laporan.chocolateHot.qty += item.qty;
            laporan.chocolateHot.subtotal += (item.harga * item.qty);
        }
        if (nama === "Mojito") {
            laporan.mojito.qty += item.qty;
            laporan.mojito.subtotal += (item.harga * item.qty);
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
    document.getElementById("lapChocolateIce").innerText = `${laporan.chocolateIce.qty} (Rp ${formatRupiah(laporan.chocolateIce.subtotal)})`;
    document.getElementById("lapChocolateHot").innerText = `${laporan.chocolateHot.qty} (Rp ${formatRupiah(laporan.chocolateHot.subtotal)})`;
    document.getElementById("lapMojito").innerText = `${laporan.mojito.qty} (Rp ${formatRupiah(laporan.mojito.subtotal)})`;
    document.getElementById("lapTotalQty").innerText = laporan.totalQty;
    document.getElementById("lapOmzet").innerText = formatRupiah(laporan.omzet);
    document.getElementById("lapCash").innerText = `${laporan.cash.transaksi} Transaksi (Rp ${formatRupiah(laporan.cash.total)})`;
    document.getElementById("lapQris").innerText = `${laporan.qris.transaksi} Transaksi (Rp ${formatRupiah(laporan.qris.total)})`;
}

function generateStruk(uang, kembali, data, metode) {
    const strukContainer = document.getElementById("strukContainer");
    const strukIsi = document.getElementById("strukIsi");
    
    // Format tanggal dan waktu
    const now = new Date();
    const tanggal = now.toLocaleDateString("id-ID", {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    const jam = now.toLocaleTimeString("id-ID", {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Generate nomor transaksi
    const nomorTransaksi = 'TRX' + now.getFullYear() + 
                          ('0' + (now.getMonth() + 1)).slice(-2) + 
                          ('0' + now.getDate()).slice(-2) + 
                          Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Hitung subtotal
    let subtotalItems = 0;
    for (let nama in data) {
        subtotalItems += data[nama].harga * data[nama].qty;
    }
    
    // Badge metode pembayaran
    const metodeBadge = metode === "CASH" ? 
        '<span class="payment-badge cash">💵 CASH</span>' : 
        '<span class="payment-badge qris">📱 QRIS</span>';
    
    // Mulai membangun HTML items
    let itemsHTML = '';
    for (let nama in data) {
        const item = data[nama];
        const subtotal = item.harga * item.qty;
        itemsHTML += `
            <div class="item-row">
                <span class="item-name">${nama}</span>
                <span class="item-qty">${item.qty}x</span>
                <span class="item-price">Rp ${formatRupiah(subtotal)}</span>
            </div>
            <div class="item-sub">
                @ Rp ${formatRupiah(item.harga)}
            </div>
        `;
    }
    
    // Bagian total berdasarkan metode
    let totalHTML = `
        <div class="total-row">
            <span class="label">Subtotal</span>
            <span class="value">Rp ${formatRupiah(subtotalItems)}</span>
        </div>
    `;
    
    if (metode === "CASH") {
        totalHTML += `
            <div class="total-row">
                <span class="label">Tunai</span>
                <span class="value">Rp ${formatRupiah(uang)}</span>
            </div>
            <div class="total-row">
                <span class="label">Kembali</span>
                <span class="value">Rp ${formatRupiah(kembali)}</span>
            </div>
        `;
    }
    
    totalHTML += `
        <div class="total-row grand-total">
            <span>TOTAL</span>
            <span>Rp ${formatRupiah(subtotalItems)}</span>
        </div>
        <div class="total-row" style="margin-top: 15px;">
            <span class="label">Metode Pembayaran</span>
            <span>${metodeBadge}</span>
        </div>
    `;
    
    // HTML lengkap struk - LANGSUNG DI STRUKISI, tanpa elemen duplikat
    strukIsi.innerHTML = `
        <div class="struk-header">
            <h2>JACK'S MORGAN</h2>
            <p class="store-address">Jl. Martadinata, Tasikmalaya</p>
            <p class="store-address">Telp: 085217126754</p>
            <div class="transaction-no">
                ${nomorTransaksi}
            </div>
            <p>${tanggal} ${jam}</p>
            <p style="font-size: 12px; margin-top: 5px;">Kasir: ${currentUser || '-'}</p>
        </div>
        
        <hr>
        
        <div class="struk-items">
            ${itemsHTML}
        </div>
        
        <hr>
        
        <div class="total-section">
            ${totalHTML}
        </div>
        
        <hr>
        
        <div class="thanks">
            <p>Terima Kasih 🙏</p>
            <small>Barang yang sudah dibeli tidak dapat dikembalikan</small>
            <small style="margin-top: 5px;">~ Selamat Menikmati ~</small>
        </div>
        
        <button onclick="tutupStruk()" class="tutup-struk-btn">
            Tutup Struk
        </button>
    `;
    
    // Tampilkan struk container
    strukContainer.style.display = "flex";
}

function tutupStruk() {
    const strukContainer = document.getElementById("strukContainer");
    strukContainer.style.display = "none";
}

function resetLaporan() {
    if (confirm("Reset semua data laporan hari ini?")) {
        laporan = {
            chocolateIce: { qty: 0, subtotal: 0 },
            chocolateHot: { qty: 0, subtotal: 0 },
            mojito: { qty: 0, subtotal: 0 },
            totalQty: 0,
            cash: { total: 0, transaksi: 0 },
            qris: { total: 0, transaksi: 0 },
            omzet: 0
        };
        saveData();
        updateLaporan();
    }
}

// ================= EXPORT EXCEL =================
function tutupKasir() {
    if (laporan.omzet === 0) return alert("Belum ada transaksi!");

    const dateStr = new Date().toLocaleDateString("id-ID");
    const filename = `Laporan_Kasir_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Data susunan Excel
    let data = [
        ["LAPORAN PENJUALAN HARIAN - JACK'S MORGAN"],
        ["Tanggal:", dateStr],
        [],
        ["REKAP PENJUALAN MENU"],
        ["Nama Menu", "Jumlah Terjual", "Total Penjualan (Rp)"],
        ["Chocolate Ice", laporan.chocolateIce.qty, laporan.chocolateIce.subtotal],
        ["Chocolate Hot", laporan.chocolateHot.qty, laporan.chocolateHot.subtotal],
        ["Mojito", laporan.mojito.qty, laporan.mojito.subtotal],
        ["TOTAL CUP TERJUAL", laporan.totalQty, ""],
        [],
        ["REKAP PEMBAYARAN"],
        ["Metode Pembayaran", "Jumlah Transaksi", "Total Pendapatan (Rp)"],
        ["Tunai (Cash)", laporan.cash.transaksi, laporan.cash.total],
        ["QRIS", laporan.qris.transaksi, laporan.qris.total],
        ["TOTAL OMZET KESELURUHAN", "", laporan.omzet]
    ];

    let ws = XLSX.utils.aoa_to_sheet(data);

    // Style Konfigurasi
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4472C4" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "center" } };
    const cellStyle = { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const boldStyle = { font: { bold: true }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const moneyFormat = "#,##0";

    // Terapkan ke Header & Tabel Menu (Baris 5-9)
    ["A5", "B5", "C5"].forEach(c => ws[c].s = headerStyle);
    for (let r = 6; r <= 8; r++) {
        ["A" + r, "B" + r, "C" + r].forEach(c => { if (ws[c]) ws[c].s = cellStyle; });
        ws["C" + r].z = moneyFormat;
    }
    ws["A9"].s = boldStyle;
    ws["B9"].s = boldStyle;
    ws["C9"].s = cellStyle;

    // Terapkan ke Header & Tabel Pembayaran (Baris 12-15)
    ["A12", "B12", "C12"].forEach(c => ws[c].s = headerStyle);
    for (let r = 13; r <= 14; r++) {
        ["A" + r, "B" + r, "C" + r].forEach(c => { if (ws[c]) ws[c].s = cellStyle; });
        ws["C" + r].z = moneyFormat;
    }
    ws["A15"].s = boldStyle;
    ws["C15"].s = boldStyle;
    ws["C15"].z = moneyFormat;

    // Judul Utama Bold
    ws["A1"].s = { font: { bold: true, sz: 14 } };

    ws["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 25 }];
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, filename);
}

// ================= EVENT LISTENERS =================

// Format rupiah pada input uang bayar
document.getElementById("uangBayar").addEventListener("input", function(e) {
    let val = e.target.value.replace(/\D/g, "");
    e.target.value = val ? formatRupiah(parseInt(val)) : "";
});

// Event listener untuk metode pembayaran
document.querySelectorAll('input[name="metode"]').forEach(r => {
    r.addEventListener("change", function() {
        const uangBayarInput = document.getElementById("uangBayar");
        const qrisSection = document.getElementById("qrisSection");
        
        if (this.value === "qris") {
            uangBayarInput.style.display = "none";
            qrisSection.style.display = "flex";
            document.getElementById("kembalian").innerText = "0";
            uangBayarInput.value = "";
        } else {
            uangBayarInput.style.display = "block";
            qrisSection.style.display = "none";
        }
    });
});

// Render awal
renderTable();

updateLaporan();
