import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const port = 3000;
const app = express();

app.use(express.json());

app.get('/movies', async (_req, res) => {
  const movies = await prisma.movie.findMany({
    orderBy: { 
      title: "asc" 
    },
    include: {
      languages: true,
      genres: true,
    }
  });
  res.json(movies); 
});

app.post('/movies', async (req, res) => {
  const {
    title,
    genre_id, 
    language_id,
    oscar_count,
    release_date
  } = req.body; 

  try{
    await prisma.movie.create({
      data: {
        title,
        genre_id,
        language_id,
        oscar_count,
        release_date: new Date(release_date)
      }
    })
  } catch(err){
    return res.status(500).send({message: 'Falha ao cadastrar um filme'})
  }
  res.status(201).send()
});

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});