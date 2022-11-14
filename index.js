import express from 'express';
import joi from 'joi';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

dotenv.config();

const app = express()


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Servidor funcionando na ${PORT}!`);
})