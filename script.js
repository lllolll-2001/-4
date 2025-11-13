let currentUser = null;
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

  // Получаем актуальные записи с сервера
  const records = await fetchRecords();

  if(records.some(r => r.data.date === newRecord.date && r.data.time === newRecord.time)) {
    alert('Выбранное время уже занято!');
    return;
  }

  await addRecord(newRecord);
}

// ----------------- API -----------------
async function fetchRecords() {
  const res = await fetch('/api/records');
  const records = await res.json();
  renderRecords(records);
  showEarnings(records);
  return records; // возвращаем для локальной проверки
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
    fetchRecords(); // обновляем записи после входа
    toggleEarningsSection();
  } else {
    alert('Неверный логин или пароль');
  }
}

// ----------------- ОТОБРАЖЕНИЕ -----------------
function renderRecords(records) {
  const container = document.getElementById('recordsContainer');
  container.innerHTML = '';
  records.forEach(r => {
    const div = document.createElement('div');
    div.className = 'record';
    div.innerHTML = `<b>${r.data.name}</b> | ${r.data.vehicle} | ${r.data.radius} | ${r.data.service} | ${r.data.date} ${r.data.time} <br>
      Создал: ${r.data.createdBy}`;
    
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
function calculateEarnings(records, period='day') {
  if(!records) return 0;
  const now = new Date();
  let filtered = [];

  if(period==='day') filtered = records.filter(r=>r.data.sum && r.data.date===now.toISOString().split('T')[0]);
  if(period==='week') {
    const start = new Date(now); start.setDate(now.getDate()-now.getDay());
    filtered = records.filter(r=>r.data.sum && new Date(r.data.date) >= start && new Date(r.data.date) <= now);
  }
  if(period==='month') {
    const month = now.getMonth(), year = now.getFullYear();
    filtered = records.filter(r=>r.data.sum && new Date(r.data.date).getMonth()===month && new Date(r.data.date).getFullYear()===year);
  }
  return filtered.reduce((acc,r)=>acc+parseFloat(r.data.sum||0),0);
}

function showEarnings(records) {
  if(!currentUser || currentUser.role !== 'boss') return;
  const period = document.getElementById('earningPeriod')?.value || 'day';
  document.getElementById('earningsDisplay').innerText = calculateEarnings(records, period)+' грн';
}

function toggleEarningsSection() {
  const section = document.getElementById('earningsSection');
  if(currentUser && currentUser.role==='boss') section.style.display='block';
  else section.style.display='none';
}

// ----------------- ИНИЦИАЛИЗАЦИЯ -----------------
fetchRecords();
