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

  if (!newRecord.name || !newRecord.date || !newRecord.time) {
    alert('Заполните все поля');
    return;
  }

  if (records.some(r => r.date === newRecord.date && r.time === newRecord.time)) {
    alert('Выбранное время уже занято!');
    return;
  }

  await addRecord(newRecord);
}

// ----------------- API -----------------
async function fetchRecords() {
  try {
    const res = await fetch('/api/records');
    if (!res.ok) throw new Error('Ошибка при загрузке записей');
    records = await res.json();
    renderRecords();
  } catch (e) {
    console.error(e);
    alert('Не удалось загрузить записи');
  }
}

async function addRecord(record) {
  try {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!res.ok) throw new Error('Ошибка при добавлении записи');
    await fetchRecords(); // Ждем обновления после POST
  } catch (e) {
    console.error(e);
    alert('Не удалось добавить запись');
  }
}

async function updateRecord(id, update) {
  try {
    const res = await fetch('/api/records', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, update })
    });
    if (!res.ok) throw new Error('Ошибка при обновлении записи');
    await fetchRecords(); // Ждем обновления после PUT
  } catch (e) {
    console.error(e);
    alert('Не удалось обновить запись');
  }
}

// ----------------- ЛОГИН -----------------
async function login(username, password) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      alert('Вход успешен');
      renderRecords();
    } else {
      alert('Неверный логин или пароль');
    }
  } catch (e) {
    console.error(e);
    alert('Ошибка при входе');
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

    // Кнопки для работников
    if (currentUser && currentUser.role === 'worker') {
      div.innerHTML += `<br>
        <button onclick="markStatus(${r.id}, 'Сделано')">Сделано</button>
        <button onclick="markStatus(${r.id}, 'Не приехал')">Не приехал</button>
        <button onclick="addWork(${r.id})">Добавить работу</button>`;
    }

    container.appendChild(div);
  });
}

// ----------------- РАБОТА -----------------
async function addWork(recordId = null) {
  const workName = prompt('Что сделано?');
  if (!workName) return;

  const sum = prompt('Сумма:');
  if (!sum) return;

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

// ----------------- ИНИЦИАЛИЗАЦИЯ -----------------
fetchRecords();
