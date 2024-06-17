import express from 'express';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';

const prisma = new PrismaClient();
const port = 3000;
const app = express();

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/movies', async (req, res) => {
  const language_id = Number(req.query.language);
  const sort = req.query.sort

  let where = {};
  if (language_id){
    const language = await prisma.language.findUnique({
      where: {
        id: language_id,
      }
    });

    if (!language) return res.status(404).json({ message: 'idioma do filme não econtrado' }) 
    where = { language_id };
  };

  const validSortParams = ['title', 'release_date', 'duration'];
  let sortParams: string = 'title';

  if (typeof sort === 'string' && validSortParams.includes(sort)) {
    sortParams = sort;
  }
  let orderBy: { [key: string]: 'asc' | 'dec' } = {};
  orderBy[sortParams] = 'asc'

  try {
    const movies = await prisma.movie.findMany({
      where,
      orderBy,
      include: {
        languages: true,
        genres: true,
      }
    });
  
    const totalMovies = movies.length;
    const averageDuration = movies.reduce((acc, cur) => acc + (cur.duration || 0), 0) / totalMovies;
    res.json({ totalMovies, averageDuration, movies}); 
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Ocorreu um erro ao buscar os filmes" });
  }
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
});

app.get('/movies/genres/:genreName', async (req, res) => {
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

app.put('/genres/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body; 
  
  const genre = await prisma.genre.findUnique({
    where: {
      id
    }
  })
  if (!genre) return res.status(404).send({message: 'Gênero não encontrado!'});
  

  try {
    if (!name) return res.status(400).send({message: 'O nome do gênero é obrigatório'});

    const genreAlreadyExist = await prisma.genre.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })

    if(genreAlreadyExist) return res.status(409).send({message: 'O Gênero informado já existe'})

    const genreUpdate = await prisma.genre.update({
      where: {
        id
      }, 
      data: {
        name
      }
    })

    res.status(200).send(genreUpdate);

  } catch (err) {
    console.log(err);
    res.status(500).send({message:'Falha ao atualizar o gênero do filme'});
  }
});

app.post('/genres', async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).send({message: 'Nome do gênero não informado'});

  try {
    const genreAlreadyExist = await prisma.genre.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })

    if(genreAlreadyExist) return res.status(409).send({message: 'O Gênero informado já existe'})

    const genreCreated = await prisma.genre.create({
      data: {
        name
      }
    })
    
    res.status(201).send(genreCreated);
  } catch (err) {
    console.log(err);
    res.status(500).send({message:'Falha ao cadastrar um novo gênero'});
  }
  //verificar se já existe gênero com esse nome 
  // Criar Gênero novo

});

app.get('/genres', async (_req, res) => {
  try{
    const genres = await prisma.genre.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    res.status(200).send(genres);
  } catch (err) {
    console.log(err);
    res.status(500).send({message:'Falha ao listar os gêneros'});
  }
});

app.delete('/genres/:id', async (req, res) => {
  const id = Number(req.params.id);

  try{
    const genre = await prisma.genre.findUnique({
      where: {
        id
      }
    })
    if(!genre) return res.status(404).send({message: 'Gênero não encontrado!'});

    await prisma.genre.delete({
      where: {
        id
      }
    })
    res.status(200).send({message: 'Gênero excluido com sucesso'});
  } catch (err) {
    console.log(err);
    res.status(500).send({message:'Falha ao excluir o gênero'});
  };
});

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});