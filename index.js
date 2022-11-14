import express from 'express';
import joi from 'joi';
import cors from 'cors';
import { MongoClient, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

const app = express();

app.use(express.json());
app.use(cors());

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db = null;
const promise = mongoClient.connect().then(() => {
    db = mongoClient.db(process.env.MONGO_DATABASE);
  });

promise.catch((err) => {
    console.log('Erro ao conectar o banco de dados!')

});

app.post('/participants', async (req, res) => {
    const participant = req.body;

    const participantsSchema = joi.object({
        name: joi.string().required()
      });

    const { error } = participantsSchema.validate(participant);

    if(error) {
       return res.sendStatus(422);
    }
    
    try {
        
        const participantsExists = await db.collection("participantes").findOne({ name: participant.name }) 
        if(participantsExists){
           return res.sendStatus(409); 
        }
    
        await db.collection('participants').insertOne({ name: participant.name, lastStatus: Date.now()});
        
        await db.collection('messages').insertOne({
            from: participant.name, 
            to: 'Todos', 
            text: 'entra na sala...', 
            type: 'status', 
            time: dayjs().format('HH:MM:SS'),
            })

        res.sendStatus(201);
    
    } catch (error) {
        console.error({ error });
        res.Status(500).send("Falha no cadastro");
    }
   

});

app.get('/participants', async (req, res) => {
    try {
       const participantsExists = await db.collection('participants').find();
        res.send(participants);
    } catch (error) {
        console.error({ error });
        res.Status(500).send("Falha ao tentar pegar todos os participantes");
    }
})




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Servidor funcionando na ${PORT}!`);
})