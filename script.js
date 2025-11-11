let currentUser = null;
let records = [];
let timeSelect = document.getElementById('serviceTime');

// Время
function fillTimeSlots() {
  timeSelect.innerHTML = '';
  for(let h=8; h<=16; h++) {
    timeSelect.innerHTML += `<option>${h}:00</option>`;
    timeSelect.innerHTML += `<option>${h}:50</option>`;
  }
}
fillTimeSlots();

// Минимальная дата
document.getElementById('serviceDate').min = new Date().toISOString().split('T')[0];

// Клиентская запись
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
  if(!currentUser) return alert('Войдите в систему');
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

// Отрисовка
function renderRecords() {
  const container = document.getElementById('recordsContainer');
  container.innerHTML = '';
  records.forEach(r=>{
    const div = document.createElement('div');
    div.className='record';
    div.innerHTML = `<b>${r.name}</b> | ${r.vehicle || ''} | ${r.radius || ''} | ${r.service || ''} | ${r.date || ''} ${r.time || ''} <br> 
    Создал: ${r.createdBy} <br>`;
    if(currentUser && currentUser.role==='worker') {
      div.innerHTML += `<button onclick="updateRecord(${r.id},{status:'Сделано'})">Сделано</button>
                        <button onclick="updateRecord(${r.id},{status:'Не приехал'})">Не приехал</button>`;
      div.innerHTML += `<button onclick="addWork(${r.id})">Добавить работу</button>`;
    }
    container.appendChild(div);
  });
}

// Добавление работы
async function addWork(recordId=null){
  if(!currentUser) return alert('Войдите в систему');
  const workName = prompt('Что сделано?');
  const sum = prompt('Сумма:');
  if(!workName || !sum) return;
  const workRecord = {
    name: workName,
    sum: Number(sum),
    date: new Date().toISOString().split('T')[0],
    createdBy: currentUser.username,
    linkedTo: recordId
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
