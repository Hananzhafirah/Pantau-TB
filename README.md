# PANTAU-TB

**PANTAU-TB** adalah prototipe web untuk klasifikasi probabilistik suspek Tuberkulosis (TB) menggunakan **Naive Bayes** dan visualisasi **indeks pemantauan spasial**.

- Live demo: https://hananzhafirah.github.io/Pantau-TB/
- Repository: https://github.com/Hananzhafirah/Pantau-TB

> PANTAU-TB adalah prototipe akademik. Posterior Naive Bayes bukan diagnosis klinis, dan indeks spasial bukan probabilitas penularan.

## Model utama

Masalah suspek diformalkan sebagai klasifikasi biner:

```text
C ∈ {TB, bukan TB}
P(C | X) ∝ P(C) × ∏ P(x_i | C)
```

Evidence yang digunakan: riwayat kontak TB, batuk ≥14 hari, keringat malam, penurunan berat badan, demam berkepanjangan, merokok, diabetes, kepadatan hunian, ventilasi rumah, status gizi, dan usia ≥50 tahun.

Parameter Naive Bayes pada web sekarang **konsisten dengan constructed dataset 100 record** yang dipakai pada laporan: 21 record TB dan 79 bukan TB. Dataset tersedia pada:

```text
data/constructed_tb_100.csv
```

Koordinat rumah dan riwayat lokasi **tidak** masuk ke evidence Naive Bayes.

## Aturan spasial

Bandwidth prototype:

```text
confirmed = 42 m
suspect   = 30 m
place     = 80 m
```

Bobot jarak:

```text
w(d,R) = 0                         jika d ≥ R
w(d,R) = x²(3 - 2x), x = 1-d/R    jika d < R
```

Beberapa kontribusi digabungkan:

```text
Risk(q) = 1 - ∏(1 - c_i(q))
```

Suspek tetap dapat membentuk kontribusi pada **lapisan spasial di sekitar koordinatnya sendiri**, tetapi **tidak menaikkan place score lokasi publik**.

## Place index

Place score hanya dibentuk dari **riwayat kunjungan kasus TB terkonfirmasi** pada tempat tersebut.

Untuk setiap kunjungan yang masuk jendela demo 7 hari:

```text
Event = clamp(0.13 × E × G × D × I, 0.01, 0.72)

D = clamp(duration_minutes / 60, 0.20, 3.00)
I = 0.35 (Tidak), 0.75 (Belum diketahui), 1.00 (Ya)
```

Beberapa kunjungan pada tempat yang sama:

```text
VisitSignal = 1 - ∏(1 - Event_k)
```

Tanggal kunjungan dipakai sebagai **filter inklusi**: hari ini sampai 6 hari sebelumnya ikut menghitung place index; kunjungan ≥7 hari tetap tersimpan di histori tetapi tidak ikut place score. Tidak ada linear recency decay pada Event.

Kontribusi place ke lapisan spasial:

```text
c_place(q) = clamp((PlaceScore/100) × 0.52 × w(d,80), 0, 0.48)
```

Semua koefisien spasial tersebut adalah **heuristic prototype parameters**, bukan nilai klinis terkalibrasi.

## Konvensi koordinat

PANTAU-TB menggunakan urutan:

```text
Latitude, Longitude
contoh: -7.753299, 110.362741
```

Form input sekarang menggunakan label `Latitude` dan `Longitude` secara eksplisit dan mendeteksi kesalahan umum ketika urutan keduanya tertukar. Pada halaman **Data Orang**, setiap record menampilkan koordinat lengkap dan tautan langsung untuk membuka titik tersebut di Google Maps.

## Penyimpanan data

Versi GitHub Pages tidak memiliki database server. Input pengguna disimpan dengan **localStorage** pada browser.

Perilakunya:

- data tetap ada setelah tab/browser ditutup dan dibuka kembali pada **browser + domain yang sama**;
- storage key dibuat stabil (`pantauTB_userPatients`) agar update versi web tidak membuat histori seolah hilang;
- versi ini juga memigrasikan data dari storage key lama bila ditemukan;
- data tidak otomatis tersinkron ke perangkat/browser lain;
- private/incognito mode, penghapusan site data, atau pembersihan browser dapat menghapus localStorage.

Untuk mengurangi risiko kehilangan data, halaman **Data Orang** menyediakan:

- **Export backup** → mengunduh seluruh histori sebagai JSON;
- **Import backup** → menggabungkan backup JSON ke histori browser.

Untuk penggunaan berkelanjutan lintas pengguna/perangkat, sistem tetap membutuhkan backend/database nyata seperti Firebase, Supabase, PostgreSQL, atau layanan sejenis. Naive Bayes adalah algoritma klasifikasi; **persistensi data merupakan masalah arsitektur penyimpanan yang terpisah dari Naive Bayes**.

## Histori Data Orang

Halaman **Data Orang** sekarang menyimpan dan menampilkan detail:

- ID/NIK termasking,
- status suspek/terkonfirmasi,
- probabilitas model untuk suspek,
- umur dan jenis kelamin,
- latitude/longitude rumah,
- tautan Google Maps,
- jenis tes dan status potensi infeksius untuk confirmed,
- seluruh evidence aktif untuk suspek,
- seluruh riwayat lokasi kunjungan beserta tanggal dan durasinya,
- timestamp saat record dibuat.

## Struktur file

```text
pantauTB/
├── index.html
├── records.html
├── methodology.html
├── styles.css
├── core.js
├── dashboard.js
├── records.js
├── common.js
├── methodology.js
├── seed-data.js
├── data/
│   └── constructed_tb_100.csv
└── assets/
```

## Menjalankan lokal

```bash
git clone https://github.com/Hananzhafirah/pantauTB.git
cd pantauTB
python -m http.server 8000
```
