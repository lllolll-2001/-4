import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI; mongodb+srv://Vlad_2001:<Vlad.2001>@cluster0.pm6xdyj.mongodb.net/?appName=Cluster0
let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Не задана MONGODB_URI в .env');
}

client = new MongoClient(uri);
clientPromise = client.connect();

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db('tire_shop');
  const collection = db.collection('records');

  if (req.method === 'GET') {
    const records = await collection.find({}).toArray();
    res.status(200).json(records);
  } else if (req.method === 'POST') {
    const newRecord = req.body;
    if (!newRecord) return res.status(400).json({ message: 'Некорректные данные' });
    newRecord.createdAt = new Date();
    const result = await collection.insertOne(newRecord);
    res.status(201).json({ message: 'Запись добавлена', record: result });
  } else if (req.method === 'PUT') {
    const { id, update } = req.body;
    if (!id || !update) return res.status(400).json({ message: 'Некорректные данные' });
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
    res.status(200).json({ message: 'Запись обновлена', result });
  } else {
    res.status(405).json({ message: 'Метод не поддерживается' });
  }
}
