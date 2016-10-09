#!/usr/bin/env node

const program = require('commander');
const request = require('request');
const chalk = require('chalk');
const et = require('expand-tilde');
const SERVER = 'http://timeline.najomi.org';
const fs = require('fs');

program.version('0.0.1');
program
  .command('checklogin <user> <pass>')
  .action(function(user, pass){
    request
      .get(SERVER, (err, res) => {
        if(err){
          throw err;
        }

        if(res.statusCode === 200){
          console.log(chalk.green('Пароль подходит для сервера'));
        }else{
          console.log(chalk.red('Что-то ты не угадал +_+'));
        }
      })
      .auth(user, pass);
  });

program
  .command('savelogin <user> <pass>')
  .action(function(user, pass){
    const pth = et('~/.butl.json');

    fs.writeFile(pth, JSON.stringify({ user, pass}, null, 2), (err) => {
      if(err){
        throw err;
      }
      console.log(chalk.green(`Пароль сохранён в файл "${pth}"`));
    });
  });


program.parse(process.argv);
