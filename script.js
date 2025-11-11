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

// Минимальная дата сегодня
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

  if(!newRecord.name || !newRecord.date || !newRecord.time) {
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
  showEarnings(); // обновляем прибыль при каждой загрузке
}

async function addRecord(record) {
  await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  await fetchRecords();
}

async function updateRecord(id, update) {
  await fetch('/api/records', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, update })
  });
  await fetchRecords();
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

    div.innerHTML = `<b>${r.name}</b> | ${r.vehicle || ''} | ${r.radius || ''} | ${r.service || ''} | ${r.date || ''} ${r.time || ''} <br>
    Создал: ${r.createdBy} <br>
    Статус: ${r.status || '-'} | Сумма: ${r.sum || '-'}`;

    // ----------------- РАБОЧИЕ КНОПКИ -----------------
    if(currentUser && currentUser.role === 'worker') {
      div.innerHTML += `<br>
        <button onclick="markStatus(${r.id}, 'Сделано')">Сделано</button>
        <button onclick="markStatus(${r.id}, 'Не приехал')">Не приехал</button>
        <button onclick="addWork(${r.id})">Добавить работу</button>`;
    }

    container.appendChild(div);
  });
}

// ----------------- РАБОТА -----------------
async function addWork(recordId=null) {
  const workName = prompt('Что сделано?');
  if(!workName) return;

  const sum = prompt('Сумма:');
  if(!sum) return;

  const workRecord = {
    name: workName,
    sum,
    date: new Date().toISOString().split('T')[0],
    createdBy: currentUser.username,
    linkedTo: recordId
  };

  await addRecord(workRecord);
}

async function markStatus(id, status) {
  const sum = status === 'Сделано' ? prompt('Введите сумму за работу:') : undefined;
  await updateRecord(id, { status, sum });
}

// ----------------- ЗАРАБОТОК НАЧАЛЬНИКА -----------------
function calculateEarnings(period = 'day') {
  if (!records || records.length === 0) return 0;

  const now = new Date();
  let filtered = [];

  if (period === 'day') {
    filtered = records.filter(r => r.sum && r.date === now.toISOString().split('T')[0]);
  }

  if (period === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // начало недели
    filtered = records.filter(r => {
      if (!r.sum) return false;
      const recordDate = new Date(r.date);
      return recordDate >= startOfWeek && recordDate <= now;
    });
  }

  if (period === 'month') {
    const month = now.getMonth();
    const year = now.getFullYear();
    filtered = records.filter(r => {
      if (!r.sum) return false;
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === month && recordDate.getFullYear() === year;
    });
  }

  return filtered.reduce((acc, r) => acc + parseFloat(r.sum || 0), 0);
}

function showEarnings() {
  if(!currentUser || currentUser.role !== 'boss') return;

  const period = document.getElementById('earningPeriod')?.value || 'day';
  const total = calculateEarnings(period);
  const display = document.getElementById('earningsDisplay');
  if(display) display.innerText = total + ' грн';
}

function toggleEarningsSection() {
  const section = document.getElementById('earningsSection');
  if(currentUser && currentUser.role === 'boss') {
    section.style.display = 'block';
    showEarnings();
  } else {
    section.style.display = 'none';
  }
}

// ----------------- ИНИЦИАЛИЗАЦИЯ -----------------
fetchRecords();
