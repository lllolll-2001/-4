import fetch from 'node-fetch';

let records = []; // Хранение в памяти

// Функция для отправки в Telegram
async function sendToTelegram(text) {
  const token = process.env.TG_BOT_TOKEN;
  const chat_id = process.env.TG_CHAT_ID;
  if (!token || !chat_id) return;
  
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text })
  });
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(records);
  } 
  
  if (req.method === 'POST') {
    const newRecord = req.body;
    if (!newRecord) return res.status(400).json({ message: 'Некорректные данные' });

    // Добавление уникального ID
    newRecord.id = Date.now();

    records.push(newRecord);

    // Отправка Telegram уведомления для новых записей от клиента
    if(newRecord.createdBy === 'client') {
      const text = `Новая запись:\nИмя: ${newRecord.name}\nУслуга: ${newRecord.service}\nДата: ${newRecord.date}\nВремя: ${newRecord.time}`;
      await sendToTelegram(text);
    }

    return res.status(201).json({ message: 'Запись добавлена', record: newRecord });
  } 
  
  if (req.method === 'PUT') {
    const { id, update } = req.body;
    const record = records.find(r => r.id === id);
    if (!record) return res.status(404).json({ message: 'Запись не найдена' });

    Object.assign(record, update);

    // Если обновляется сумма или статус, отправляем в Telegram
    if(update.status || update.sum) {
      const text = `Запись обновлена:\nИмя: ${record.name}\nСтатус: ${record.status || '-'}\nСумма: ${record.sum || '-'}`;
      await sendToTelegram(text);
    }

    return res.status(200).json({ message: 'Запись обновлена', record });
  }

  return res.status(405).json({ message: 'Метод не поддерживается' });
}
