let records = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(records);
  } else if (req.method === 'POST') {
    const newRecord = req.body;
    if (newRecord) {
      newRecord.id = Date.now();
      records.push(newRecord);
      res.status(201).json({ message: 'Запись добавлена', record: newRecord });
    } else {
      res.status(400).json({ message: 'Некорректные данные' });
    }
  } else {
    res.status(405).json({ message: 'Метод не поддерживается' });
  }
}
