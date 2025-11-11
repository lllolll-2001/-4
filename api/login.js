const users = [
  { username: 'boss', password: '1234', role: 'worker' },
  { username: 'worker', password: '1111', role: 'worker' }
];

export default function handler(req, res) {
  if(req.method === 'POST') {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if(user) {
      res.status(200).json({ user });
    } else {
      res.status(401).json({ message: 'Неверный логин или пароль' });
    }
  } else {
    res.status(405).json({ message: 'Метод не поддерживается' });
  }
}
if(currentUser.role === 'boss') {
  document.getElementById('bossFilter').style.display = 'block'; // показываем блок фильтра
} else {
  document.getElementById('bossFilter').style.display = 'none';
}
