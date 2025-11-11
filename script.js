let currentUser = null;
let records = [];
const timeSelect = document.getElementById('serviceTime');

// ----------------- ВРЕМЯ -----------------
function fillTimeSlots() {
  timeSelect.innerHTML = '';
  for (let h = 8; h <= 16; h++) {
    timeSelect.innerHTML += `<option>${h}:00</option>`;
    timeSelect.innerHTML += `<option>${h}:50</option>`;
  }
}
fillTimeSlots();

document.getElementById('serviceDate').min = new Date().toISOString().split('T')[0];

// ----------------- КЛИЕНТ -----------------
async function submitClientRecord() {
  const newRecord = {
    name: document.getElementById('clientName').value.trim(),
    vehicle: document.getElementById('vehicleType').value,
    radius: document.getElementById('wheelRadius').value,
    service: document.getElementById('service').value,
    date: document.getElementById('serviceDate').value,
    time: document.getElementById('serviceTime').value,
    createdBy: 'client'
  };

  if(!newRecord.name || !newRecord.date || !newRecord.time || !newRecord.vehicle || !newRecord.radius || !newRecord.service) {
    alert('Заполните все поля');
    return;
  }

  if(records.some(r => r.date === newRecord.date && r.time === newRecord.time)) {
    alert('Выбранное время уже занято!');
    return;
  }

  await addRecord(newRecord);
}

// ----------------- API -----------------
async function fetchRecords() {
  const res = await fetch('/api/records');
  records = await res.json();
  renderRecords();
  showEarnings();
}

async function addRecord(record) {
  await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  fetchRecords();
}

async function updateRecord(id, update) {
  await fetch('/api/records', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, update })
  });
  fetchRecords();
}

// ----------------- ЛОГИН -----------------
async function login(username, password) {
  const res = await fetch('/api/login', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ username, password })
  });

  if(res.status === 200) {
    const data = await res.json();
    currentUser = data.user;
    alert('Вход успешен');
    renderRecords();
    toggleEarningsSection();
  } else {
    alert('Неверный логин или пароль');
  }
}

// ----------------- ОТОБРАЖЕНИЕ -----------------
function renderRecords() {
  const container = document.getElementById('recordsContainer');
  container.innerHTML = '';
  records.forEach(r => {
    const div = document.createElement('div');
    div.className = 'record';
    div.innerHTML = `<b>${r.name}</b> | ${r.vehicle} | ${r.radius} | ${r.service} | ${r.date} ${r.time} <br>
      Создал: ${r.createdBy}`;
    
    if(currentUser && currentUser.role === 'worker') {
      div.innerHTML += `<br>
        <button onclick="markStatus(${r.id}, 'Сделано')">Сделано</button>
        <button onclick="markStatus(${r.id}, 'Не приехал')">Не приехал</button>`;
    }

    container.appendChild(div);
  });
}

// ----------------- РАБОТА -----------------
async function markStatus(id, status) {
  const sum = status === 'Сделано' ? prompt('Введите сумму за работу:') : undefined;
  await updateRecord(id, { status, sum });
}

// ----------------- ЗАРАБОТОК -----------------
function calculateEarnings(period='day') {
  if(!records) return 0;
  const now = new Date();
  let filtered = [];

  if(period==='day') filtered = records.filter(r=>r.sum && r.date===now.toISOString().split('T')[0]);
  if(period==='week') {
    const start = new Date(now); start.setDate(now.getDate()-now.getDay());
    filtered = records.filter(r=>r.sum && new Date(r.date) >= start && new Date(r.date) <= now);
  }
  if(period==='month') {
    const month = now.getMonth(), year = now.getFullYear();
    filtered = records.filter(r=>r.sum && new Date(r.date).getMonth()===month && new Date(r.date).getFullYear()===year);
  }
  return filtered.reduce((acc,r)=>acc+parseFloat(r.sum||0),0);
}

function showEarnings() {
  if(!currentUser || currentUser.role !== 'boss') return;
  const period = document.getElementById('earningPeriod')?.value || 'day';
  document.getElementById('earningsDisplay').innerText = calculateEarnings(period)+' грн';
}

function toggleEarningsSection() {
  const section = document.getElementById('earningsSection');
  if(currentUser && currentUser.role==='boss') section.style.display='block';
  else section.style.display='none';
}

// ----------------- ИНИЦИАЛИЗАЦИЯ -----------------
fetchRecords();
