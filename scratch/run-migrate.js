const fs = require('fs');
const tty = require('tty');
tty.isatty = () => true;
process.stdout.isTTY = true;
process.stdin.isTTY = true;

// Override process.exit so we can see what's happening
const originalExit = process.exit;
process.exit = function(code) {
  console.log('Exiting with code', code);
  originalExit(code);
};

// Set arguments
process.argv = ['node', 'node_modules/prisma/build/index.js', 'migrate', 'dev', '--name', 'bloco3_team_expandido_aliases_season'];

// Monkey-patch readline to auto-answer 'y'
const readline = require('readline');
const originalCreateInterface = readline.createInterface;
readline.createInterface = function(options) {
  const rl = originalCreateInterface(options);
  const originalQuestion = rl.question.bind(rl);
  rl.question = function(query, callback) {
    console.log('Answering yes to:', query);
    callback('y');
  };
  return rl;
};

require(require.resolve('prisma'));
