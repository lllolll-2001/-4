let records = [];
let users = [
  {id:1, username:'boss', password:'boss123', role:'boss'},
  {id:2, username:'worker', password:'worker123', role:'worker'}
];

export default function handler(req,res){
  if(req.method==='GET'){
    res.status(200).json(records);
  }
  else if(req.method==='POST'){
    const {username,password,...rest} = req.body;
    // Логин
    if(username && password){
      const user = users.find(u=>u.username===username && u.password===password);
      if(user) res.status(200).json({user});
      else res.status(401).json({message:'Неверный логин/пароль'});
      return;
    }
    const newRecord = {...rest};
    newRecord.id = Date.now();
    newRecord.dateCreated = new Date().toISOString();
    records.push(newRecord);
    res.status(201).json({message:'Запись добавлена', record:newRecord});
  }
  else if(req.method==='PUT'){
    const {id, update} = req.body;
    const record = records.find(r=>r.id===id);
    if(record){
      Object.assign(record, update);
      res.status(200).json({message:'Запись обновлена', record});
    } else res.status(404).json({message:'Запись не найдена'});
  }
  else res.status(405).json({message:'Метод не поддерживается'});
}