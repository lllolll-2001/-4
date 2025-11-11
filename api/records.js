import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'records.json');

function loadRecords() {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveRecords(records) {
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
}

export default function handler(req, res) {
  let records = loadRecords();

  if (req.method === 'GET') {
    res.status(200).json(records);
  } 
  else if (req.method === 'POST') {
    const newRecord = req.body;
    if (!newRecord) return res.status(400).json({ message: 'Некорректные данные' });

    newRecord.id = Date.now();
    records.push(newRecord);
    saveRecords(records);
    res.status(201).json({ message: 'Запись добавлена', record: newRecord });
  } 
  else if (req.method === 'PUT') {
    const { id, update } = req.body;
    const record = records.find(r => r.id === id);
    if (record) {
      Object.assign(record, update);
      saveRecords(records);
      res.status(200).json({ message: 'Запись обновлена', record });
    } else {
      res.status(404).json({ message: 'Запись не найдена' });
    }
  } 
  else {
    res.status(405).json({ message: 'Метод не поддерживается' });
  }
}
