const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const classesList = ["Class 6th","Class 7th","Class 8th","Class 9th","Class 10th"];
let allData = {}; // { "Class 6th": {settings..., table:[]},... }
let currentClass = "Class 6th";
let deferredPrompt;

window.addEventListener('load', () => {
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js'); }
  loadAllData();
  classSelect.onchange = () => { currentClass = classSelect.value; loadClassData(); };
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; installBtn.style.display = 'block'; });
  installBtn.onclick = async () => { if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt = null; } };
});

generateBtn.onclick = generateTable;
saveBtn.onclick = () => saveData(false);
saveAllBtn.onclick = () => saveData(true);
printBtn.onclick = () => window.print();
printAllBtn.onclick = printAll;
applyTimingBtn.onclick = applyTimingToAll;

sessionSelect.onchange = () => { startTime.value = sessionSelect.value=='summer'? '07:30' : '08:30'; }

function generateTable(){
  const school = schoolName.value || 'My School';
  const incharge = inchargeName.value || 'N/A';
  const start = startTime.value;
  const pMins = parseInt(periodMins.value);
  const bMins = parseInt(breakMins.value);

  printTitle.innerText = `${school} | ${currentClass} | Incharge: ${incharge} | ${sessionSelect.value.toUpperCase()}`;
  timetableArea.classList.remove('hidden');

  let times = getTimes(start, pMins, bMins);
  for(let i=1; i<=8; i++){ document.getElementById('p'+i).innerHTML = `${i} <br><small>${times[i-1]}</small>`; }

  timetableBody.innerHTML = '';
  days.forEach(day => {
    let row = `<tr><td><b>${day}</b></td>`;
    for(let p=1; p<=8; p++){
      if(p==7) row += `<td class="break-col">BREAK</td>`;
      row += `<td><input data-day="${day}" data-period="${p}" placeholder="Subject - Teacher"></td>`;
    }
    row += `</tr>`;
    timetableBody.innerHTML += row;
  });
  loadTableData();
}

function getTimes(start, pMins, bMins){
  let [h,m] = start.split(':').map(Number); let arr = [];
  for(let i=0; i<8; i++){
    let s = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    m += pMins; if(m>=60){ h++; m-=60; }
    if(i==5){ m += bMins; if(m>=60){ h++; m-=60; } }
    let e = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    arr.push(`${s}-${e}`);
  }
  return arr;
}

function saveData(saveAll){
  if(!allData[currentClass]) allData[currentClass] = {};
  allData[currentClass].settings = {
    school: schoolName.value, incharge: inchargeName.value, session: sessionSelect.value,
    start: startTime.value, pMins: periodMins.value, bMins: breakMins.value
  };
  allData[currentClass].table = [...document.querySelectorAll('#timetableBody input')].map(i=>i.value);

  if(saveAll){
    classesList.forEach(c => { if(!allData[c]) allData[c] = {settings: allData[currentClass].settings, table: Array(48).fill('')} });
  }
  localStorage.setItem('timetable_v2_all', JSON.stringify(allData));
  alert(saveAll? '✅ All Classes Saved' : `✅ ${currentClass} Saved`);
}

function loadAllData(){
  allData = JSON.parse(localStorage.getItem('timetable_v2_all') || '{}');
  loadClassData();
}

function loadClassData(){
  const d = allData[currentClass];
  if(d && d.settings){
    schoolName.value=d.settings.school; inchargeName.value=d.settings.incharge;
    sessionSelect.value=d.settings.session; startTime.value=d.settings.start;
    periodMins.value=d.settings.pMins; breakMins.value=d.settings.bMins;
    generateTable();
  } else {
    generateTable();
  }
}

function loadTableData(){
  const d = allData[currentClass];
  if(d && d.table){
    document.querySelectorAll('#timetableBody input').forEach((i,idx)=> i.value=d.table[idx]||'');
  }
}

function applyTimingToAll(){
  classesList.forEach(c => {
    if(!allData[c]) allData[c]={};
    allData[c].settings = {...allData[c].settings, session: sessionSelect.value, start: startTime.value, pMins: periodMins.value, bMins: breakMins.value};
  });
  saveData(true);
  alert('✅ Timing Applied to All 5 Classes');
}

function printAll(){
  let printWindow = window.open('', '_blank');
  let html = `<html><head><title>All Classes Time Table</title><link rel="stylesheet" href="style.css"></head><body>`;
  classesList.forEach((cls, idx) => {
    currentClass = cls; loadClassData(); generateTable();
    const d = allData[cls];
    if(d && d.table){
      document.querySelectorAll('#timetableBody input').forEach((i,idx)=> i.value=d.table[idx]||'');
    }
    html += document.getElementById('timetableArea').outerHTML;
    if(idx < classesList.length-1) html += `<div class="page-break"></div>`;
  });
  html += `</body></html>`;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(()=> printWindow.print(), 500);
}
