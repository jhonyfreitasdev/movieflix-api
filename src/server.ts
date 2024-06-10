import express from 'express';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';

const prisma = new PrismaClient();
const port = 3000;
const app = express();

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

app.get('/movies/:id', async (_req, res) => {
  const { id } = _req.params;
  const movie = await prisma.movie.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      languages: true,
      genres: true,
    }
  });
  res.json(movie);
})

app.post('/movies', async (req, res) => {
  const {
    title,
    genre_id, 
    language_id,
    oscar_count,
    release_date
  } = req.body; 

  try{
    const moviesWithSameTitle = await prisma.movie.findFirst({
      where: { 
        // title - Se passar somente a propriedade ele não vai diferenciar letras maiúsculas de minusculas 
        title: { equals: title, mode: 'insensitive' }
      }
    })

    if(moviesWithSameTitle){
      return res.status(409).send(
        {message: 'Já existe um filme com esse título'}
      )
    }
  
    await prisma.movie.create({
      data: {
        title,
        genre_id,
        language_id,
        oscar_count,
        release_date: new Date(release_date)
      }
    })
    res.status(201).send({message: 'Filme cadastrado com sucesso'})
  } catch(err){
    return res.status(500).send({message: 'Falha ao cadastrar um filme'})
  }
  res.status(201).send()
  
});

app.put('/movies/:id', async (req, res ) => {
  const id = Number(req.params.id);
  const data = { ...req.body };
  data.release_date = data.release_date 
    ? new Date(data.release_date) : undefined;

  try {
    const movie = await prisma.movie.findUnique({
    where: {
      id
    }
    })

    if(!movie) return res.status(404).send({message: 'Filme não encontrado!'});
  
    await prisma.movie.update({
      where: { 
        id
      },
      data
    })  
    res.status(200).send({message: 'Campos atuializado com sucesso'})
  } catch (err) {
    console.log(err);
    res.status(404).send({message:'Falha ao atualizar os campos da tabela'});
  }

})

app.delete('/movies/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const movie = await prisma.movie.findUnique({
      where: { id }
    })

    if(!movie) return res.status(404).send({message: 'Filme não encontrado!'}); 

    await prisma.movie.delete({
      where: { id }
    })

    res.status(200).send({message: 'Filme excluido com sucesso'});
  } catch (err) {
    console.log(err);
    res.status(404).send({message:'Falha ao excluir o filme'});
  }  
})

app.get('/:genreName', async (req, res) => {
  const genreParams = req.params.genreName;
  try{
    const filteredByGenres = await prisma.movie.findMany({
      include: {
        genres: true,
        languages: true,
      },
      where: {
        genres: {
          name: {
            equals: genreParams,
            mode: 'insensitive'
          }  
        }
      }
    })
  
    res.status(200).send(filteredByGenres);
  } catch (err) {
    console.log(err);
    res.status(500).send({message:'Falha ao filtrar filmes por gênero'});
  }
});

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});