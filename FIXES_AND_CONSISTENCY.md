# PANTAU-TB — Fixes & Consistency Notes

Versi ini memperbaiki lima masalah pengujian web dan menyelaraskan implementasi dengan aturan pada laporan final.

## 1. Latitude / Longitude
- Label `X / Latitude` dan `Y / Longitude` dihapus karena membingungkan.
- Form sekarang memakai `Latitude` dan `Longitude` secara eksplisit.
- Urutan baku: `latitude, longitude`, contoh `-7.753299, 110.362741`.
- Sistem mendeteksi kesalahan umum bila longitude dan latitude tertukar.
- Histori menampilkan koordinat 6 desimal dan link langsung ke Google Maps.

## 2. Place index tidak naik saat dua confirmed mengunjungi lokasi yang sama
- Place score sekarang hanya dihitung dari kunjungan TB confirmed yang benar-benar memilih tempat tersebut.
- Jendela demo 7 hari dipakai sebagai filter inklusi (0–6 hari), bukan linear recency decay.
- Rumus event diselaraskan dengan laporan:
  `Event = clamp(0.13 × E × G × D × I, 0.01, 0.72)`.
- Infectiousness place: `Tidak=0.35`, `Belum diketahui=0.75`, `Ya=1.00`.
- Multi-visit: `VisitSignal = 1 - Π(1-Event_k)`.
- Uji: Mie Gacoan Jombor 1 confirmed (60 menit, infectious=Ya) = 12/100; 2 confirmed = 22/100.
- Uji report: Boshe, 3 confirmed dengan durasi 90/180/85 menit = sekitar 66/100, sesuai perhitungan teori ~0.663.

## 3. Histori Data Orang
- Registry sekarang expandable dan menampilkan detail lengkap:
  - koordinat rumah,
  - link Google Maps,
  - timestamp input,
  - tes dan infectiousness untuk confirmed,
  - evidence lengkap untuk suspect,
  - seluruh daftar kunjungan, tanggal, dan durasi.

## 4. Lokasi publik berubah padahal tidak dikunjungi
- Dihapus `nearby suspect background` dari place score.
- Suspek masih dapat berkontribusi pada layer spatial di sekitar koordinatnya sendiri sesuai desain peta, tetapi tidak lagi menaikkan skor tempat publik.
- Tempat tanpa kunjungan confirmed aktif = place score 0.

## 5. Histori hilang setelah web ditutup/dibuka
- Storage key diubah dari key berversi menjadi key stabil: `pantauTB_userPatients`.
- Sistem otomatis memigrasikan data dari key lama yang berawalan `pantauTB_userPatients`.
- Ditambahkan export/import backup JSON.
- Data browser-local tetap bertahan setelah browser ditutup pada browser + domain yang sama.
- Tanpa database server, data tidak dapat dijamin sinkron lintas perangkat/browser dan dapat hilang jika site data dibersihkan atau saat memakai private/incognito mode.

## Konsistensi Naive Bayes
- Core web sebelumnya masih menggunakan demo prior 0.12 dan likelihood hardcoded lama.
- Versi ini menggunakan parameter dari constructed dataset 100 record yang sama dengan laporan: prior `P(TB)=0.21` dan likelihood Tabel I.
- Konsekuensi: skenario report dengan hanya `kontak=Ya`, `batuk>=14`, `keringat malam=Ya` dan evidence lain negatif menghasilkan sekitar **66.6%**, bukan 49%. Angka pada bagian hasil laporan perlu diselaraskan jika skenario inputnya memang persis demikian.

## Konsistensi Spatial Place
- Bandwidth confirmed: 42 m.
- Bandwidth suspect: 30 m.
- Bandwidth place: 80 m.
- Place spatial scaling: 0.52, cap 0.48.
