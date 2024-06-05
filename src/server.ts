import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const port = 3000;
const app = express();

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

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});