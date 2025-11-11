let currentUser = null;
let records = [];
let timeSelect = document.getElementById('serviceTime');

// Заполняем слоты с 8:00 до 17:00 каждые 50 минут
function fillTimeSlots() {
  timeSelect.innerHTML = '';
  let h = 8, m = 0;
  while(h < 17) {
    const hh = String(h).padStart(2,'0');
    const mm = String(m).padStart(2,'0');
    timeSelect.innerHTML += `<option>${hh}:${mm}</option>`;
    m += 50;
    if(m >= 60){
      h += 1;
      m = m - 60;
    }
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
    createdBy: 'client',
    status: 'Ожидает',
    sum: 0
  };
  if(records.some(r=>r.date===newRecord.date && r.time===newRecord.time)) {
    alert('Выбранное время уже занято!');
    return;
  }
  await addRecord(newRecord);
}

// API
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
  const res = await fetch('/api/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username,password})
  });
  if(res.status===200) {
    const data = await res.json();
    currentUser = data.user;
    alert('Вход успешен');

    document.getElementById('recordsContainer').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';

    if(currentUser.role === 'boss') {
      document.getElementById('bossFilter').style.display = 'block';
    }

    fetchRecords();
  } else {
    alert('Неверный логин или пароль');
  }
}

// Отрисовка записей
function renderRecords() {
  const container = document.getElementById('recordsContainer');
  container.innerHTML = '';
  records.forEach(r => {
    const div = document.createElement('div');
    div.className='record';
    div.innerHTML = `<b>${r.name}</b> | ${r.vehicle || ''} | ${r.radius || ''} | ${r.service || ''} | ${r.date || ''} ${r.time || ''} <br> 
    Статус: ${r.status || 'Ожидает'} | Сумма: ${r.sum || 0} грн <br>
    Создал: ${r.createdBy} <br>`;

    // Работник
    if(currentUser && currentUser.role==='worker') {
      div.innerHTML += `<button onclick="markArrived(${r.id})">Приехал</button>
                        <button onclick="markNoShow(${r.id})">Не приехал</button>`;
    }

    container.appendChild(div);
  });

  // Кнопка добавления произвольной работы для работников
  if(currentUser && currentUser.role==='worker') {
    const workDiv = document.createElement('div');
    workDiv.className = 'record';
    workDiv.innerHTML = `<button onclick="addWork()">Добавить выполненную работу</button>`;
    container.appendChild(workDiv);
  }
}

// Пометить "Приехал" с суммой
async function markArrived(id){
  const sum = prompt('Введите сумму за ремонт:');
  if(sum === null) return;
  await updateRecord(id, {status:'Приехал', sum:Number(sum)});
}

// Пометить "Не приехал"
async function markNoShow(id){
  await updateRecord(id, {status:'Не приехал'});
}

// Добавление произвольной работы
async function addWork(){
  const workName = prompt('Что сделано?');
  const sum = prompt('Сумма:');
  if(!workName || !sum) return;
  const workRecord = {
    name: workName,
    sum: Number(sum),
    date: new Date().toISOString().split('T')[0],
    createdBy: currentUser.username,
    status:'Сделано'
  };
  await addRecord(workRecord);
}

// Фильтр босса
function filterRecords(period) {
  if(currentUser?.role !== 'boss') return;
  const now = new Date();
  let filtered = [];

  if(period === 'day') {
    filtered = records.filter(r => r.date === now.toISOString().split('T')[0]);
  } else if(period === 'week') {
    const firstDay = new Date();
    firstDay.setDate(now.getDate() - now.getDay());
    filtered = records.filter(r => {
      const rDate = new Date(r.date);
      return rDate >= firstDay && rDate <= now;
    });
  } else if(period === 'month') {
    filtered = records.filter(r => {
      const rDate = new Date(r.date);
      return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
    });
  }

  const sum = filtered.reduce((acc,r)=>acc + (Number(r.sum)||0),0);
  document.getElementById('filterResult').innerText = `Сумма: ${sum} грн`;
}

// Инициализация
fetchRecords();
