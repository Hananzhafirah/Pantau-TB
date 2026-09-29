document.addEventListener('DOMContentLoaded',()=>{
  const {PTB}=window;
  const table=document.getElementById('recordTable');
  const search=document.getElementById('search');
  const exportBtn=document.getElementById('exportData');
  const importInput=document.getElementById('importData');

  const esc=(v)=>String(v??'')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#039;");

  const fmtDate=(value)=>{
    if(!value)return '-';
    const d=new Date(value);
    return Number.isNaN(d.getTime())?esc(value):d.toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'});
  };

  function travelHtml(p){
    const visits=Array.isArray(p.travel)?p.travel:[];
    if(!visits.length)return '<div class="detail-empty">Tidak ada riwayat kunjungan tersimpan.</div>';
    return `<div class="travel-history">${visits.map((v,i)=>`
      <div class="travel-history-item">
        <strong>${i+1}. ${esc(v.placeName||'-')}</strong>
        <span>Tanggal: ${esc(v.date||'-')}</span>
        <span>Durasi: ${Number(v.duration||0)} menit</span>
      </div>`).join('')}</div>`;
  }

  function suspectEvidenceHtml(p){
    if(p.status!=='suspect')return '—';
    const r=PTB.suspectProbability(p);
    const active=r.evidence.length?r.evidence.map(esc).join(', '):'Tidak ada evidence positif';
    return `${active}<br><small>Posterior tersimpan: ${Math.round(Number(p.risk_probability??r.probability)*100)}%</small>`;
  }

  function render(){
    const all=PTB.allPatients();
    const q=String(search.value||'').trim().toLowerCase();
    const rows=all.filter(p=>{
      const hay=[
        p.id,p.nik,p.status,p.testType,p.infectious,p.lat,p.lng,
        ...(Array.isArray(p.travel)?p.travel.map(v=>v.placeName):[])
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });

    const confirmed=all.filter(p=>p.status==='confirmed').length;
    const suspect=all.length-confirmed;
    document.getElementById('recordStats').innerHTML=
      `<span class="record-stat"><strong>${all.length}</strong> total</span>
       <span class="record-stat"><strong>${confirmed}</strong> terkonfirmasi</span>
       <span class="record-stat"><strong>${suspect}</strong> suspek</span>
       <span class="record-stat"><strong>${all.reduce((n,p)=>n+(Array.isArray(p.travel)?p.travel.length:0),0)}</strong> riwayat kunjungan</span>`;

    if(!rows.length){
      table.innerHTML='<div class="empty-registry"><strong>Belum ada data yang cocok.</strong><span>Tambahkan data dari Peta Utama atau ubah kata pencarian.</span></div>';
      return;
    }

    table.innerHTML=rows.map(p=>{
      const isConfirmed=p.status==='confirmed';
      const pr=isConfirmed?null:Number(p.risk_probability??PTB.suspectProbability(p).probability);
      const coords=PTB.normalizeCoordinates(p.lat,p.lng);
      const coordText=coords.valid?`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`:'Koordinat tidak valid';
      const mapUrl=coords.valid?PTB.googleMapsUrl(coords.lat,coords.lng):'#';
      const visits=Array.isArray(p.travel)?p.travel.length:0;
      const label=p.source==='user'?PTB.maskNIK(p.nik):(p.id||'-');

      return `<details class="record-entry">
        <summary class="record-summary">
          <strong>${esc(label)}</strong>
          <span><i class="status-chip ${esc(p.status)}">${isConfirmed?'Terkonfirmasi':'Suspek'}</i></span>
          <span>${pr==null?'—':Math.round(pr*100)+'%'}</span>
          <span>${esc(p.umur_tahun||'-')}</span>
          <span>${esc(p.jenis_kelamin||'-')}</span>
          <span class="coord-short">${esc(coordText)}</span>
          <span>${visits} kunjungan</span>
          <span class="detail-cta">Lihat detail</span>
        </summary>

        <div class="record-detail">
          <div class="detail-block">
            <h3>Identitas &amp; domisili</h3>
            <dl>
              <div><dt>ID internal</dt><dd>${esc(p.id||'-')}</dd></div>
              <div><dt>NIK / ID</dt><dd>${esc(p.nik||'-')}</dd></div>
              <div><dt>Dibuat</dt><dd>${fmtDate(p.createdAt)}</dd></div>
              <div><dt>Latitude, Longitude</dt><dd><code>${esc(coordText)}</code></dd></div>
            </dl>
            ${coords.valid?`<a class="btn soft compact" href="${esc(mapUrl)}" target="_blank" rel="noopener">Buka lokasi rumah di Google Maps</a>`:''}
          </div>

          <div class="detail-block">
            <h3>${isConfirmed?'Data konfirmasi TB':'Data skrining suspek'}</h3>
            ${isConfirmed?`
              <dl>
                <div><dt>Tes</dt><dd>${esc(p.testType||'-')}</dd></div>
                <div><dt>Tanggal konfirmasi</dt><dd>${esc(p.diagnosisDate||'-')}</dd></div>
                <div><dt>Status potensi infeksius</dt><dd>${esc(p.infectious||'-')}</dd></div>
              </dl>`:
              `<p class="evidence-full">${suspectEvidenceHtml(p)}</p>`}
          </div>

          <div class="detail-block detail-block-wide">
            <h3>Riwayat lokasi yang dikunjungi</h3>
            ${travelHtml(p)}
          </div>
        </div>
      </details>`;
    }).join('');
  }

  exportBtn?.addEventListener('click',()=>{
    const payload=PTB.exportPatients();
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`pantauTB-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    PTB.toast('Backup JSON berhasil dibuat.');
  });

  importInput?.addEventListener('change',async()=>{
    const file=importInput.files?.[0];
    if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      const records=Array.isArray(parsed)?parsed:parsed.records;
      PTB.importPatients(records,{replace:false});
      render();
      PTB.toast('Backup berhasil diimpor dan digabungkan.');
    }catch(err){
      console.error(err);
      PTB.toast('Backup tidak dapat dibaca. Pastikan file JSON berasal dari PANTAU-TB.');
    }finally{
      importInput.value='';
    }
  });

  search.addEventListener('input',render);
  window.addEventListener('storage',render);
  window.addEventListener('focus',render);
  render();
});
