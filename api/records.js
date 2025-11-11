// pages/api/records.js

// Хранение всех записей в памяти (при перезапуске сервера данные сбрасываются)
let records = [];

export default function handler(req, res) {
  if(req.method === 'GET') {
    // Возвращаем все записи
    res.status(200).json(records);

  } else if(req.method === 'POST') {
    const newRecord = req.body;

    if(!newRecord) return res.status(400).json({ message: 'Некорректные данные' });

    newRecord.id = Date.now(); // уникальный ID по времени
    records.push(newRecord);

    res.status(201).json({ message: 'Запись добавлена', record: newRecord });

  } else if(req.method === 'PUT') {
    // Обновление записи по id
    const { id, update } = req.body;
    const record = records.find(r => r.id === id);

    if(record) {
      Object.assign(record, update);
      res.status(200).json({ message: 'Запись обновлена', record });
    } else {
      res.status(404).json({ message: 'Запись не найдена' });
    }

  } else {
    res.status(405).json({ message: 'Метод не поддерживается' });
  }
}
