let total = 0;

let keranjang = JSON.parse(localStorage.getItem("keranjang")) || {};
let laporan = JSON.parse(localStorage.getItem("laporan")) || {
    chocolateIce: { qty: 0, subtotal: 0 },
    chocolateHot: { qty: 0, subtotal: 0 },
    mojito: { qty: 0, subtotal: 0 },
    omzet: 0
};

// ===============================
// SIMPAN DATA
// ===============================
function saveData() {
    localStorage.setItem("keranjang", JSON.stringify(keranjang));
    localStorage.setItem("laporan", JSON.stringify(laporan));
}

// ===============================
// FORMAT RUPIAH
// ===============================
function formatRupiah(angka) {
    return angka.toLocaleString("id-ID");
}

// ===============================
// RESET KEMBALIAN
// ===============================
function resetKembalian() {
    document.getElementById("kembalian").innerText = "0";
}

// ===============================
// TAMBAH ITEM
// ===============================
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

    resetKembalian();

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

    resetKembalian();

    delete keranjang[nama];
    renderTable();
    saveData();
}

// ===============================
// RENDER TABLE
// ===============================
function renderTable() {

    let table = document.getElementById("daftarBelanja");
    table.innerHTML = "";
    total = 0;

    for (let nama in keranjang) {
        let item = keranjang[nama];
        let subtotal = item.harga * item.qty;
        total += subtotal;

        let row = table.insertRow();
        row.insertCell(0).innerHTML = nama;
        row.insertCell(1).innerHTML = formatRupiah(item.harga);
        row.insertCell(2).innerHTML = `
            <button onclick="kurangiItem('${nama}')">-</button>
            ${item.qty}
            <button onclick="tambahItem('${nama}', ${item.harga})">+</button>
        `;
        row.insertCell(3).innerHTML = formatRupiah(subtotal);
        row.insertCell(4).innerHTML = `<button onclick="hapusItem('${nama}')">🗑</button>`;
    }

    document.getElementById("total").innerText = formatRupiah(total);
}

// ===============================
// BAYAR
// ===============================
function bayar() {

    if (Object.keys(keranjang).length === 0) {
        alert("Belum ada pesanan!");
        return;
    }

    let uang = parseInt(document.getElementById("uangBayar").value.replace(/\./g, ""));
    if (uang >= total) {

        let kembali = uang - total;
        document.getElementById("kembalian").innerText = formatRupiah(kembali);

        let snapshot = JSON.parse(JSON.stringify(keranjang));

        for (let nama in snapshot) {
    let item = snapshot[nama];
    let subtotal = item.harga * item.qty;

    if (nama === "Chocolate Ice") {
        laporan.chocolateIce.qty += item.qty;
        laporan.chocolateIce.subtotal += subtotal;
    }

    if (nama === "Chocolate Hot") {
        laporan.chocolateHot.qty += item.qty;
        laporan.chocolateHot.subtotal += subtotal;
    }

    if (nama === "Mojito") {
        laporan.mojito.qty += item.qty;
        laporan.mojito.subtotal += subtotal;
    }
}

        laporan.omzet += total;

        saveData();
        updateLaporan();

        generateStruk(uang, kembali, snapshot);

        keranjang = {};
        renderTable();
        saveData();

        document.getElementById("uangBayar").value = "";
    } else {
        alert("Uang tidak cukup!");
    }
}

// ===============================
// STRUK
// ===============================
function generateStruk(uang, kembali, dataKeranjang) {

    document.getElementById("strukContainer").style.display = "flex";
    document.getElementById("strukTanggal").innerText =
        new Date().toLocaleString("id-ID");

    let isi = "";
    for (let nama in dataKeranjang) {
        let item = dataKeranjang[nama];
        let subtotal = item.harga * item.qty;
        isi += `${nama} x${item.qty}<br>Rp ${formatRupiah(subtotal)}<br><br>`;
    }

    document.getElementById("strukIsi").innerHTML = isi;
    document.getElementById("strukTotal").innerText =
        "Total : Rp " + formatRupiah(total);
    document.getElementById("strukBayar").innerText =
        "Bayar : Rp " + formatRupiah(uang);
    document.getElementById("strukKembali").innerText =
        "Kembali : Rp " + formatRupiah(kembali);
}

function tutupStruk() {
    document.getElementById("strukContainer").style.display = "none";
}

// ===============================
// UPDATE LAPORAN
// ===============================
function updateLaporan() {

    document.getElementById("lapChocolateIce").innerText =
        laporan.chocolateIce.qty + " (Rp " +
        formatRupiah(laporan.chocolateIce.subtotal) + ")";

    document.getElementById("lapChocolateHot").innerText =
        laporan.chocolateHot.qty + " (Rp " +
        formatRupiah(laporan.chocolateHot.subtotal) + ")";

    document.getElementById("lapMojito").innerText =
        laporan.mojito.qty + " (Rp " +
        formatRupiah(laporan.mojito.subtotal) + ")";

    document.getElementById("lapOmzet").innerText =
        formatRupiah(laporan.omzet);
}

// ===============================
// RESET LAPORAN
// ===============================
function resetLaporan() {
    
    // Tambahan dialog konfirmasi (Opsional)
    if (!confirm("Apakah Anda yakin ingin mereset semua laporan hari ini?")) return;

    // Reset ke struktur data yang BENAR
    laporan = {
        chocolateIce: { qty: 0, subtotal: 0 },
        chocolateHot: { qty: 0, subtotal: 0 },
        mojito: { qty: 0, subtotal: 0 },
        omzet: 0
    };
    keranjang = {};

    localStorage.removeItem("keranjang");
    localStorage.removeItem("laporan");

    renderTable();
    updateLaporan();
    resetKembalian();

    document.getElementById("strukContainer").style.display = "none";
}

// ===============================
// EXPORT
// ===============================
function tutupKasir() {

    if (laporan.omzet === 0) {
        alert("Belum ada transaksi hari ini!");
        return;
    }

    let today = new Date();
    let tanggalFile =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, '0') + "-" +
        String(today.getDate()).padStart(2, '0');

    let data = [
    ["LAPORAN KASIR HARIAN"],
    ["Tanggal", today.toLocaleDateString("id-ID")],
    [],
    ["Menu", "Qty Terjual", "Subtotal"],
    [
        "Chocolate Ice",
        laporan.chocolateIce.qty,
        laporan.chocolateIce.subtotal
    ],
    [
        "Chocolate Hot",
        laporan.chocolateHot.qty,
        laporan.chocolateHot.subtotal
    ],
    [
        "Mojito",
        laporan.mojito.qty,
        laporan.mojito.subtotal
    ],
    [],
    ["TOTAL OMZET", "", laporan.omzet]
];

    let ws = XLSX.utils.aoa_to_sheet(data);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");

    XLSX.writeFile(wb, `Laporan_Kasir_${tanggalFile}.xlsx`);

    // Reset ke struktur data yang BENAR setelah direkap
    laporan = {
        chocolateIce: { qty: 0, subtotal: 0 },
        chocolateHot: { qty: 0, subtotal: 0 },
        mojito: { qty: 0, subtotal: 0 },
        omzet: 0
    };
    saveData();
    updateLaporan();
}

// ===============================
// FORMAT INPUT UANG
// ===============================
document.getElementById("uangBayar").addEventListener("input", function (e) {
    let angka = e.target.value.replace(/\D/g, '');
    e.target.value = angka ? formatRupiah(parseInt(angka)) : "";
});

// Load awal
renderTable();
updateLaporan();
resetKembalian();