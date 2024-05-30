import express from 'express';

const port = 3000;
const app = express();

app.get('/movies', (req, res) => {
  res.send('Listagem de filmes');
});

// teste
app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});