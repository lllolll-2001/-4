import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = '8323226215:AAHeV_3NPLgO1koSBFGjmnFzay8fRg6HfuY';
const CHAT_ID = '8290320310';

export default async function handler(req, res) {
  if(req.method === 'POST') {
    const { message } = req.body;
    if(!message) return res.status(400).json({message: 'Нет текста сообщения'});

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' })
      });
      res.status(200).json({message: 'Отправлено'});
    } catch(e) {
      res.status(500).json({message:'Ошибка при отправке'});
    }
  } else {
    res.status(405).json({message:'Метод не поддерживается'});
  }
}
