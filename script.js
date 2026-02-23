let total = 0;

// Inisialisasi keranjang dari localStorage
let keranjang = JSON.parse(localStorage.getItem("keranjang")) || {};

// Inisialisasi laporan dari localStorage dengan struktur baru
let laporan = JSON.parse(localStorage.getItem("laporan")) || {
    bailaChocoIce: { qty: 0, subtotal: 0 },
    bailaChocoHot: { qty: 0, subtotal: 0 },
    icelandyLychee: { qty: 0, subtotal: 0 },
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

function saveData() {
    localStorage.setItem("keranjang", JSON.stringify(keranjang));
    localStorage.setItem("laporan", JSON.stringify(laporan));
}

function formatRupiah(angka) {
    if (isNaN(angka) || angka === null || angka === undefined) angka = 0;
    // Memastikan angka adalah number
    angka = parseInt(angka);
    // Format dengan titik sebagai pemisah ribuan
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseRupiah(rupiahString) {
    if (!rupiahString) return 0;
    // Menghapus titik dan karakter non-digit
    return parseInt(rupiahString.replace(/\./g, ""));
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
    if (!table) return;
    
    table.innerHTML = "";
    total = 0;
    
    for (let nama in keranjang) {
        let item = keranjang[nama];
        let sub = item.harga * item.qty;
        total += sub;
        
        let row = table.insertRow();
        // Gunakan escape untuk nama yang mengandung tanda petik
        let escapedNama = nama.replace(/'/g, "\\'");
        
        row.innerHTML = `<td>${nama}</td>
            <td>Rp ${formatRupiah(item.harga)}</td>
            <td>
                <button onclick="kurangiItem('${escapedNama}')">-</button> 
                ${item.qty} 
                <button onclick="tambahItem('${escapedNama}',${item.harga})">+</button>
            </td>
            <td>Rp ${formatRupiah(sub)}</td>
            <td><button class="delete-btn" onclick="hapusItem('${escapedNama}')">🗑</button></td>`;
    }
    
    document.getElementById("total").innerText = formatRupiah(total);
}

function bayar() {
    if (Object.keys(keranjang).length === 0) {
        alert("Keranjang kosong!");
        return;
    }
    
    // Ambil nilai dari input dan parse ke number (hapus titik)
    let inputElement = document.getElementById("uangBayar");
    let uang = parseRupiah(inputElement.value);
    
    if (isNaN(uang) || uang < total) {
        alert("Uang tidak cukup atau tidak valid!");
        return;
    }
    
    let kembali = uang - total;
    prosesLaporan("CASH");
    generateStruk(uang, kembali, JSON.parse(JSON.stringify(keranjang)), "CASH");
    
    document.getElementById("kembalian").innerText = formatRupiah(kembali);
    keranjang = {};
    renderTable();
    saveData();
    updateLaporan();
    inputElement.value = "";
}

function konfirmasiQRIS() {
    if (Object.keys(keranjang).length === 0) {
        alert("Keranjang belanja masih kosong!");
        return;
    }
    
    prosesLaporan("QRIS");
    generateStruk(total, 0, JSON.parse(JSON.stringify(keranjang)), "QRIS");
    
    keranjang = {};
    renderTable();
    saveData();
    updateLaporan();
    
    document.getElementById("qrisSection").style.display = "none";
    document.querySelector('input[name="metode"][value="cash"]').checked = true;
    document.getElementById("uangBayar").style.display = "block";
}

function prosesLaporan(metode) {
    for (let nama in keranjang) {
        let item = keranjang[nama];
        laporan.totalQty += item.qty;
        
        if (nama === "BAILA'S CHOCO ICE") {
            laporan.bailaChocoIce.qty += item.qty;
            laporan.bailaChocoIce.subtotal += (item.harga * item.qty);
        }
        else if (nama === "BAILA'S CHOCO HOT") {
            laporan.bailaChocoHot.qty += item.qty;
            laporan.bailaChocoHot.subtotal += (item.harga * item.qty);
        }
        else if (nama === "ICELANDY LYCHEE") {
            laporan.icelandyLychee.qty += item.qty;
            laporan.icelandyLychee.subtotal += (item.harga * item.qty);
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
    document.getElementById("lapBailaChocoIce").innerText = 
        `${laporan.bailaChocoIce.qty} (Rp ${formatRupiah(laporan.bailaChocoIce.subtotal)})`;
    document.getElementById("lapBailaChocoHot").innerText = 
        `${laporan.bailaChocoHot.qty} (Rp ${formatRupiah(laporan.bailaChocoHot.subtotal)})`;
    document.getElementById("lapIcelandyLychee").innerText = 
        `${laporan.icelandyLychee.qty} (Rp ${formatRupiah(laporan.icelandyLychee.subtotal)})`;
    document.getElementById("lapTotalQty").innerText = laporan.totalQty;
    document.getElementById("lapOmzet").innerText = formatRupiah(laporan.omzet);
    document.getElementById("lapCash").innerText = 
        `${laporan.cash.transaksi} Transaksi (Rp ${formatRupiah(laporan.cash.total)})`;
    document.getElementById("lapQris").innerText = 
        `${laporan.qris.transaksi} Transaksi (Rp ${formatRupiah(laporan.qris.total)})`;
}

function generateStruk(uang, kembali, data, metode) {
    const strukContainer = document.getElementById("strukContainer");
    const strukIsi = document.getElementById("strukIsi");
    
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
    
    const nomorTransaksi = 'TRX' + now.getFullYear() + 
                          ('0' + (now.getMonth() + 1)).slice(-2) + 
                          ('0' + now.getDate()).slice(-2) + 
                          Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    let subtotalItems = 0;
    for (let nama in data) {
        subtotalItems += data[nama].harga * data[nama].qty;
    }
    
    const metodeBadge = metode === "CASH" ? 
        '<span class="payment-badge cash">💵 CASH</span>' : 
        '<span class="payment-badge qris">📱 QRIS</span>';
    
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
    
    strukContainer.style.display = "flex";
}

function tutupStruk() {
    document.getElementById("strukContainer").style.display = "none";
}

function resetLaporan() {
    if (confirm("Reset semua data laporan hari ini?")) {
        laporan = {
            bailaChocoIce: { qty: 0, subtotal: 0 },
            bailaChocoHot: { qty: 0, subtotal: 0 },
            icelandyLychee: { qty: 0, subtotal: 0 },
            totalQty: 0,
            cash: { total: 0, transaksi: 0 },
            qris: { total: 0, transaksi: 0 },
            omzet: 0
        };
        saveData();
        updateLaporan();
    }
}

function tutupKasir() {
    if (laporan.omzet === 0) {
        alert("Belum ada transaksi!");
        return;
    }

    const dateStr = new Date().toLocaleDateString("id-ID");
    const filename = `Laporan_Kasir_${new Date().toISOString().split('T')[0]}.xlsx`;

    let data = [
        ["LAPORAN PENJUALAN HARIAN - JACK'S MORGAN"],
        ["Tanggal:", dateStr],
        [],
        ["REKAP PENJUALAN MENU"],
        ["Nama Menu", "Jumlah Terjual", "Total Penjualan (Rp)"],
        ["BAILA'S CHOCO ICE", laporan.bailaChocoIce.qty, laporan.bailaChocoIce.subtotal],
        ["BAILA'S CHOCO HOT", laporan.bailaChocoHot.qty, laporan.bailaChocoHot.subtotal],
        ["ICELANDY LYCHEE", laporan.icelandyLychee.qty, laporan.icelandyLychee.subtotal],
        ["TOTAL CUP TERJUAL", laporan.totalQty, ""],
        [],
        ["REKAP PEMBAYARAN"],
        ["Metode Pembayaran", "Jumlah Transaksi", "Total Pendapatan (Rp)"],
        ["Tunai (Cash)", laporan.cash.transaksi, laporan.cash.total],
        ["QRIS", laporan.qris.transaksi, laporan.qris.total],
        ["TOTAL OMZET KESELURUHAN", "", laporan.omzet]
    ];

    let ws = XLSX.utils.aoa_to_sheet(data);

    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4472C4" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "center" } };
    const cellStyle = { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const boldStyle = { font: { bold: true }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const moneyFormat = "#,##0";

    ["A5", "B5", "C5"].forEach(c => ws[c].s = headerStyle);
    for (let r = 6; r <= 8; r++) {
        ["A" + r, "B" + r, "C" + r].forEach(c => { if (ws[c]) ws[c].s = cellStyle; });
        ws["C" + r].z = moneyFormat;
    }
    ws["A9"].s = boldStyle;
    ws["B9"].s = boldStyle;
    ws["C9"].s = cellStyle;

    ["A12", "B12", "C12"].forEach(c => ws[c].s = headerStyle);
    for (let r = 13; r <= 14; r++) {
        ["A" + r, "B" + r, "C" + r].forEach(c => { if (ws[c]) ws[c].s = cellStyle; });
        ws["C" + r].z = moneyFormat;
    }
    ws["A15"].s = boldStyle;
    ws["C15"].s = boldStyle;
    ws["C15"].z = moneyFormat;

    ws["A1"].s = { font: { bold: true, sz: 14 } };
    ws["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 25 }];
    
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, filename);
}

// ================= EVENT LISTENERS =================
document.addEventListener("DOMContentLoaded", function() {
    // Cek login
    if (currentUser) showUser();
    
    // Render tabel dan laporan
    renderTable();
    updateLaporan();
    
    // Event listener untuk input uang dengan format rupiah (TITIK)
    const uangBayar = document.getElementById("uangBayar");
    if (uangBayar) {
        uangBayar.addEventListener("input", function(e) {
            let val = e.target.value.replace(/\D/g, ""); // Hanya angka
            if (val) {
                // Format dengan titik sebagai pemisah ribuan
                val = parseInt(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                e.target.value = val;
            } else {
                e.target.value = "";
            }
        });
        
        // Saat input kehilangan fokus, pastikan formatnya benar
        uangBayar.addEventListener("blur", function(e) {
            let val = e.target.value.replace(/\D/g, "");
            if (val) {
                e.target.value = parseInt(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            }
        });
    }
    
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
});