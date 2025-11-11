import fs from 'fs';
import fetch from 'node-fetch';

const FILE_PATH = './records.json';
const TELEGRAM_BOT_TOKEN = '8323226215:AAHeV_3NPLgO1koSBFGjmnFzay8fRg6HfuY';
const CHAT_ID = '8290320310';

let records = [];
try {
  if (fs.existsSync(FILE_PATH)) {
    const data = fs.readFileSync(FILE_PATH);
    records = JSON.parse(data);
  }
} catch (e) {
  console.error('Ошибка чтения records.json:', e);
}

function saveRecords() {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(records, null, 2));
  } catch (e) {
    console.error('Ошибка сохранения records.json:', e);
  }
}

async function sendToTelegram(message) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' })
    });
  } catch(e) {
    console.error('Ошибка отправки в Telegram:', e);
  }
}

export default async function handler(req, res) {
  if(req.method === 'GET') {
    res.status(200).json(records);
  } else if(req.method === 'POST') {
    const newRecord = req.body;
    if(!newRecord) return res.status(400).json({ message: 'Некорректные данные' });

    if(newRecord.username && newRecord.password) {
      return res.status(400).json({ message: 'Используйте /api/login для авторизации' });
    }

    if(newRecord.createdBy === 'client') {
      const duplicate = records.find(r => r.date === newRecord.date && r.time === newRecord.time);
      if(duplicate) return res.status(400).json({message:'Время уже занято'});
    }

    newRecord.id = Date.now();
    records.push(newRecord);
    saveRecords();

    let msg = `<b>Новая запись:</b>\nИмя: ${newRecord.name}\nУслуга: ${newRecord.service || newRecord.name}\nДата: ${newRecord.date || ''} ${newRecord.time || ''}\nСоздал: ${newRecord.createdBy}`;
    if(newRecord.sum) msg += `\nСумма: ${newRecord.sum} грн`;
    await sendToTelegram(msg);

    res.status(201).json({ message: 'Запись добавлена', record: newRecord });
  } else if(req.method === 'PUT') {
    const { id, update } = req.body;
    if(!id || !update) return res.status(400).json({ message: 'Нужны id и update' });

    const record = records.find(r => r.id === id);
    if(record) {
      Object.assign(record, update);
      saveRecords();

      let msg = `<b>Обновлена запись:</b>\nИмя: ${record.name}\nСтатус: ${record.status || ''}\nСумма: ${record.sum || 0} грн\nОбновлено: ${record.updatedBy || ''}`;
      await sendToTelegram(msg);

      res.status(200).json({ message: 'Запись обновлена', record });
    } else {
      res.status(404).json({ message: 'Запись не найдена' });
    }
  } else {
    res.status(405).json({ message: 'Метод не поддерживается' });
  }
}
