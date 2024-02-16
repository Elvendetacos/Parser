const express = require('express');
const bodyParser = require('body-parser');
const peg = require('pegjs');
const fs = require('fs');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

const grammar = fs.readFileSync('tokens.pegjs', 'utf8');
const parser = peg.generate(grammar);

app.post('/parse', (req, res) => {
  let input = req.body.data;
  input = input.replace(/\n/g, '');
  console.log('Entrada: ' + JSON.stringify(req.body));
  console.log('Entrada: ' + input);
  try {
    const result = parser.parse(input);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Error de sintaxis: ' + error.message });
  }
});

app.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});