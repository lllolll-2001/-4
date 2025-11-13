import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM records ORDER BY id');
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  } else if (req.method === 'POST') {
    const newRecord = req.body;
    if (!newRecord) return res.status(400).json({ message: 'Некорректные данные' });

    if(newRecord.username && newRecord.password) {
      return res.status(400).json({ message: 'Используйте /api/login для авторизации' });
    }

    try {
      const result = await pool.query(
        'INSERT INTO records(data) VALUES($1) RETURNING *',
        [newRecord]
      );
      res.status(201).json({ message: 'Запись добавлена', record: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  } else if (req.method === 'PUT') {
    const { id, update } = req.body;
    try {
      const result = await pool.query(
        'UPDATE records SET data = $1 WHERE id = $2 RETURNING *',
        [update, id]
      );
      if(result.rows.length) {
        res.status(200).json({ message: 'Запись обновлена', record: result.rows[0] });
      } else {
        res.status(404).json({ message: 'Запись не найдена' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  } else {
    res.status(405).json({ message: 'Метод не поддерживается' });
  }
}
