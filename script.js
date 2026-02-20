let total = 0;
let keranjang = JSON.parse(localStorage.getItem("keranjang")) || {};
let laporan = JSON.parse(localStorage.getItem("laporan")) || {
    coklat:0,
    mojito:0,
    omzet:0
};

function saveData(){
    localStorage.setItem("keranjang", JSON.stringify(keranjang));
    localStorage.setItem("laporan", JSON.stringify(laporan));
}

function formatRupiah(angka){
    return angka.toLocaleString("id-ID");
}

function tambahItem(nama,harga){
    if(!keranjang[nama]){
        keranjang[nama]={harga:harga,qty:0};
    }
    keranjang[nama].qty++;
    renderTable();
    saveData();
}

function kurangiItem(nama){
    if(keranjang[nama]){
        keranjang[nama].qty--;
        if(keranjang[nama].qty<=0){
            delete keranjang[nama];
        }
        renderTable();
        saveData();
    }
}

function hapusItem(nama){
    delete keranjang[nama];
    renderTable();
    saveData();
}

function renderTable(){
    let table=document.getElementById("daftarBelanja");
    table.innerHTML="";
    total=0;

    for(let nama in keranjang){
        let item=keranjang[nama];
        let subtotal=item.harga*item.qty;
        total+=subtotal;

        let row=table.insertRow();
        row.insertCell(0).innerHTML=nama;
        row.insertCell(1).innerHTML=formatRupiah(item.harga);
        row.insertCell(2).innerHTML=`
            <button onclick="kurangiItem('${nama}')">-</button>
            ${item.qty}
            <button onclick="tambahItem('${nama}',${item.harga})">+</button>
        `;
        row.insertCell(3).innerHTML=formatRupiah(subtotal);
        row.insertCell(4).innerHTML=`<button onclick="hapusItem('${nama}')">🗑</button>`;
    }

    document.getElementById("total").innerText=formatRupiah(total);
}

function bayar(){
    if(Object.keys(keranjang).length===0){
        alert("Belum ada pesanan!");
        return;
    }

    let uang=parseInt(document.getElementById("uangBayar").value.replace(/\./g,""));
    if(uang>=total){

        let kembali=uang-total;
        document.getElementById("kembalian").innerText=formatRupiah(kembali);

        for(let nama in keranjang){
            if(nama.includes("Coklat")) laporan.coklat+=keranjang[nama].qty;
            if(nama.includes("Mojito")) laporan.mojito+=keranjang[nama].qty;
        }

        laporan.omzet+=total;
        saveData();
        updateLaporan();
        generateStruk(uang,kembali);

        keranjang={};
        renderTable();
        saveData();

        document.getElementById("uangBayar").value="";
    }
}

function generateStruk(uang,kembali){
    document.getElementById("strukContainer").style.display="flex";
    document.getElementById("strukTanggal").innerText=
        new Date().toLocaleString("id-ID");

    let isi="";
    for(let nama in keranjang){
        let item=keranjang[nama];
        let subtotal=item.harga*item.qty;
        isi+=`${nama} x${item.qty}<br>Rp ${formatRupiah(subtotal)}<br><br>`;
    }

    document.getElementById("strukIsi").innerHTML=isi;
    document.getElementById("strukTotal").innerText=
        "Total : Rp "+formatRupiah(total);
    document.getElementById("strukBayar").innerText=
        "Bayar : Rp "+formatRupiah(uang);
    document.getElementById("strukKembali").innerText=
        "Kembali : Rp "+formatRupiah(kembali);
}

function tutupStruk(){
    document.getElementById("strukContainer").style.display="none";
}

function updateLaporan(){
    document.getElementById("lapCoklat").innerText=laporan.coklat;
    document.getElementById("lapMojito").innerText=laporan.mojito;
    document.getElementById("lapOmzet").innerText=formatRupiah(laporan.omzet);
}

function resetLaporan(){
    laporan={coklat:0,mojito:0,omzet:0};
    saveData();
    updateLaporan();
}

function tutupKasir(){

    let data=[
        ["Laporan Kasir"],
        ["Tanggal", new Date().toLocaleDateString("id-ID")],
        [],
        ["Menu","Terjual"],
        ["Coklat",laporan.coklat],
        ["Mojito",laporan.mojito],
        [],
        ["Total Omzet",laporan.omzet]
    ];

    let ws=XLSX.utils.aoa_to_sheet(data);
    let wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Laporan");

    XLSX.writeFile(wb,"Laporan_Kasir.xlsx");
}

document.getElementById("uangBayar").addEventListener("input",function(e){
    let angka=e.target.value.replace(/\D/g,'');
    e.target.value=angka?formatRupiah(parseInt(angka)):"";
});

renderTable();
updateLaporan();