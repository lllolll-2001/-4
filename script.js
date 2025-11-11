let currentUser = null;
let records = [];
const timeSelect = document.getElementById('serviceTime');

// Слоты каждые 50 минут с 8:00 до 17:00
function fillTimeSlots() {
  timeSelect.innerHTML = '';
  for(let h=8; h<17; h++) {
    timeSelect.innerHTML += `<option>${h}:00</option>`;
    timeSelect.innerHTML += `<option>${h}:50</option>`;
  }
}
fillTimeSlots();

// Минимальная дата — сегодня
document.getElementById('serviceDate').min = new Date().toISOString().split('T')[0];

// Отправка записи клиентом
async function submitClientRecord() {
  const newRecord = {
    name: document.getElementById('clientName').value,
    vehicle: document.getElementById('vehicleType').value,
    radius: document.getElementById('wheelRadius').value,
    service: document.getElementById('service').value,
    date: document.getElementById('serviceDate').value,
    time: document.getElementById('serviceTime').value,
    createdBy: 'client'
  };

  if(records.some(r => r.date === newRecord.date && r.time === newRecord.time && r.createdBy==='client')) {
    alert('Выбранное время уже занято!');
    return;
  }

  await addRecord(newRecord);
}

// API взаимодействие
async function fetchRecords() {
  const res = await fetch('/api/records');
  records = await res.json();
  renderRecords();
}

async function addRecord(record) {
  const res = await fetch('/api/records', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(record)
  });
  if(res.ok) fetchRecords();
  else alert((await res.json()).message);
}

async function updateRecord(id, update) {
  update.updatedBy = currentUser.username;
  const res = await fetch('/api/records', {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({id, update})
  });
  if(res.ok) fetchRecords();
}

// Логин
async function login(username, password) {
  const res = await fetch('/api/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username,password})
  });
  if(res.ok) {
    const data = await res.json();
    currentUser = data.user;
    alert('Вход успешен');
    renderRecords();
  } else alert('Неверный логин или пароль');
}

// Отрисовка записей
function renderRecords() {
  const container = document.getElementById('recordsContainer');
  container.innerHTML = '';
  records.forEach(r => {
    const div = document.createElement('div');
    div.className='record';
    div.innerHTML = `<b>${r.name}</b> | ${r.vehicle || ''} | ${r.radius || ''} | ${r.service || ''} | ${r.date || ''} ${r.time || ''}<br>
                     Создал: ${r.createdBy} | Статус: ${r.status || ''} | Сумма: ${r.sum || 0} грн`;

    // Кнопки только для работников
    if(currentUser && currentUser.role === 'worker') {
      div.innerHTML += `<br>
      <button onclick="markStatus(${r.id}, 'Приехал')">Приехал</button>
      <button onclick="markStatus(${r.id}, 'Не приехал')">Не приехал</button>
      <button onclick="addWork(${r.id})">Добавить работу</button>`;
    }

    container.appendChild(div);
  });
}

// Отметка статуса с возможностью ввести сумму
async function markStatus(id, status) {
  let sum = prompt('Введите сумму за работу (грн):', '0');
  if(sum===null) return; // отмена
  await updateRecord(id, { status, sum: parseFloat(sum) });
}

// Добавление работы без записи
async function addWork(recordId) {
  const workName = prompt('Что сделано?');
  if(!workName) return;
  let sum = prompt('Сумма:');
  if(sum===null) return;
  const workRecord = {
    name: workName,
    sum: parseFloat(sum),
    date: new Date().toISOString().split('T')[0],
    createdBy: currentUser.username,
    linkedTo: recordId
  };
  await addRecord(workRecord);
}

// Инициализация
fetchRecords();
