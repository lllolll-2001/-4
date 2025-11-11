let currentUser = null;
let records = [];
let timeSelect = document.getElementById('serviceTime');

// Заполняем время по 50 минут
function fillTimeSlots() {
  timeSelect.innerHTML = '';
  for(let h=8; h<=16; h++) {
    timeSelect.innerHTML += `<option>${h}:00</option>`;
    timeSelect.innerHTML += `<option>${h}:50</option>`;
  }
}
fillTimeSlots();

// Минимальная дата сегодня
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
  // Проверка на дублирование времени
  if(records.some(r=>r.date===newRecord.date && r.time===newRecord.time)) {
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
  await fetch('/api/records', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(record)
  });
  fetchRecords();
}
async function updateRecord(id, update) {
  await fetch('/api/records', {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({id, update})
  });
  fetchRecords();
}

// Логин
async function login(username, password) {
  const res = await fetch('/api/records', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username,password})
  });
  if(res.status===200) {
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
  records.forEach(r=>{
    const div = document.createElement('div');
    div.className='record';
    div.innerHTML = `<b>${r.name}</b> | ${r.vehicle} | ${r.radius} | ${r.service} | ${r.date} ${r.time} <br> 
    Создал: ${r.createdBy} <br>`;
    if(currentUser && currentUser.role==='worker') {
      div.innerHTML += `<button onclick="updateRecord(${r.id},{status:'Сделано'})">Сделано</button>
                        <button onclick="updateRecord(${r.id},{status:'Не приехал'})">Не приехал</button>`;
      div.innerHTML += `<button onclick="addWork(${r.id})">Добавить работу</button>`;
    }
    container.appendChild(div);
  });
}

// Добавление работы без записи
async function addWork(recordId=null){
  const workName = prompt('Что сделано?');
  const sum = prompt('Сумма:');
  const workRecord = {
    name: workName,
    sum: sum,
    date: new Date().toISOString().split('T')[0],
    createdBy: currentUser.username,
    linkedTo: recordId
  };
  await addRecord(workRecord);
}

// Инициализация
fetchRecords();