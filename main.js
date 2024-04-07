const express = require('express');
const bodyParser = require('body-parser');
const peg = require('pegjs');
const fs = require('fs');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

const grammar = fs.readFileSync('tokens.pegjs', 'utf8');
const parser = peg.generate(grammar);

let variables = {}
let functions = {}
let output = '';
let declarate = true

const validator = (operation) => {
  let left, right;
  if (Array.isArray(operation.left) && operation.left.flat().join('') in variables){
    left = variables[operation.left.flat().join('')];
  } else {
    left = operation.left;
  }
  if(Array.isArray(operation.right) && operation.right.flat().join('') in variables){
    right = variables[operation.right.flat().join('')];
  } else {
    right = operation.right;
  }
  switch (operation.operator) {
    case '==':
      console.log('operation ' + left + ' ' + right)
      return left == right;
    case '!=':
      return left != right;
    case '>':
      console.log(left)
      return left > right;
    case '<':
      return left < right;
    case '>=':
      console.log(left)
      return left >= right;
    case '<=':
      return left <= right;
    default:
      return false;
  }
}

function interpret(ast) {
  switch (ast.type){
    case 'print':
      const valuesToPrint = ast.value.map(arg => {
        if (typeof arg === 'string') {
          return arg;
        } else if (arg.operator) {
          const variableValue = variables[arg.value.flat().join('')];
          if (variableValue !== undefined) {
            return variableValue;
          } else {
            return arg.value;
          }
        } else if (arg.flat().join('') in variables) {
          return variables[arg.flat().join('')];
        } else{
          output += "Error: " + arg.flat().join('') + " no esta declarada"
          declarate = false
        }
      }).join('');
      if (declarate){
        output += 'Eso es todo compare: ' + valuesToPrint + "\n";
      }
      break;
    case 'assignment':
      const variableName = ast.variable.flat().join('')
      if (variableName in variables){
        output += 'Error: La variable ' + variableName + ' ya esta declarada\n';
        break
      }else{
        variables[variableName] = ast.value;
        console.log(variables)
        console.log("Declarando variable: " + ast.variable + " con valor: " + ast.value);
        break;
      }
    case 'forLoop':
      console.log("Ejecutando ciclo for");
      const start = ast.range.start;
      const end = ast.range.end
      for (i = start; i < end; i++) {
        variables[ast.variable.flat().join('')] = parseInt(i);
        console.log(variables)
        interpret(ast.statements);
      }
      break
    case 'mainFunction':
      console.log("Ejecutando main function");
      interpret(ast.statements);
      break;
    case 'ifStatement':
      console.log("Ejecutando declaración if");
      const condition = validator(ast.condition);
      if (condition) {
        console.log("Condición if verdadera, ejecutando declaraciones");
        interpret(ast.ifStatements);
      } else if (ast.elseClause) {
        console.log("Condición if falsa, ejecutando declaraciones else");
        interpret(ast.elseClause.elseStatements);
      }
      break;
    case 'function':
      console.log("Declarando función: " + ast.name.flat().join(''));
      const funcName = ast.name.flat().join('');
      functions[funcName] = {
        params: ast.params.flat().join(''),
        statements: ast.statements
      };
      break;
    case 'call':
      console.log("Ejecutando función: " + ast.variable);
      const func = functions[ast.variable.flat().join('')];
      console.log(func)
      if (func) {
        variables[func.params] = ast.params;
        console.log(variables)
        interpret(func.statements);
      } else {
        output += 'Error: La función ' + ast.variable.flat().join('') + ' no esta declarada\n';
      }
      break;
    default:
      for (let i = 0; i < ast.length; i++) {
          interpret(ast[i]);
      }
  }
}

app.post('/parse', (req, res) => {
  let input = req.body.data;
  input = input.replace(/\n/g, '');
  console.log('Entrada: ' + JSON.stringify(req.body));
  console.log('Entrada: ' + input);
  try {
    const result = parser.parse(input);
    output = '';
    interpret(result);
    res.json({result: result, output:output});
  } catch (error) {
    res.status(400).json({ error: 'Error: ' + error.message});
  }
});

app.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});