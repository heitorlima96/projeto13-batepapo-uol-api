import express from 'express';
import joi from 'joi';
import cors from 'cors';
import { MongoClient } from 'mongodb';
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

app.post('/messages', async (req, res) => {
    const message = req.body;
    const { user } = req.headers;

    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid('message', 'private_message')
    });

    const { error } = messageSchema.validate(message);

    if (error) {
        return res.sendStatus(422);
    }

    try {
        const participant = await db.collection('participants').findOne({ name: user });
        if (!participant) {
            return res.sendStatus(422);
        }
        
        const {to, text, type } = message;
        await db.collection('messages').insertOne({
            to,
            text,
            type,
            from: user,
            time: dayjs().format('HH:mm:ss')});

            res.sendStatus(201);
    } catch (error) {
        return res.status(500).send('Erro ao tentar salvar a mensagem');
    }
});

app.get('/messages', async (req, res) => {
    const limit = parseInt(req.query.limit);
    const { user } = req.headers;
  
    try {
        const messages = await db.collection("messages").find().toArray();
        const filterMessages = messages.filter(message => {
            const { from, to, type } = messages;
            const toUser = to === "Todes" || (to === user || from === user);
            const isPublic = type === "message";

            return toUser || isPublic;
        });

        if (limit && limit === NaN) {
            return res.send(filterMessages.slice(-limit));
        }

        res.send(filterMessages);
        
    } catch (error) {
        console.log('Erro ao tentar obter mensagens', error);
        res.sendStatus(500);
    }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Servidor funcionando na ${PORT}!`);
})