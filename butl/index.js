#!/usr/bin/env node
'use strict';

const program = require('commander');
const request = require('request');
const chalk = require('chalk');
const et = require('expand-tilde');
const SERVER = 'http://timeline.najomi.org';
const SYNC_LIMIT = 10;
const fs = require('fs');
const glob = require('glob');
const async = require('async');
const PB = require('progress');

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
function ensureDataDirectoryExists(next){
    const pth = et('~/.butl');
    fs.stat(pth, (err) => {
      if(err){
        return fs.mkdir(pth, (err) => {
          if(err){
            throw err;
          }
          next();
        });
      }
      next();
    });
}
program
  .command('event <name>')
  .action(function(name){
    ensureDataDirectoryExists(function(){
      let t = (new Date()).getTime();
      let pth = et(`~/.butl/${t}.json`);
      let time = Math.floor(t/1000);
      fs.writeFile(pth, JSON.stringify({time, name}, null, 2), (err) => {
        if(err){
          throw err;
        }
        console.log(chalk.green('Записано'));
      });
    });
  });

program
  .command('sync')
  .action(function(){
    const pth = et('~/.butl/*');
    const cfg = require(et('~/.butl.json'));
    glob(pth, (err, files) => {
      if(err){
        throw err;
      }
      if(!files.length){
        return console.log(chalk.green('Всё синхронизировано'));
      }
      var bar = new PB(':current/:total [:bar] :percent :eta s.', { total: files.length, width: 50});

      async.eachLimit(files, SYNC_LIMIT, (file, next) => {
        fs.readFile(file, (err, buffer) => {
          if(err){
            return next(err);
          }
          try{
            let data = JSON.parse(buffer);
            request.post(`${SERVER}/api/events`, { formData: data, auth: cfg}, (err, res) => {
              if(err){
                return next(err);
              }
              if(res.statusCode !== 200){
                return next(new Error(`Сервер ответил ${res.statusCode} ответом на файл ${file}`));
              }

              fs.unlink(file, (err) => {
                if(err){
                  return next(err);
                }
                bar.tick();
                next();
              });
            });
          }catch(e){
            next(e);
          }

        });
      }, (err) => {
        if(err){
          throw err;
        }
        console.log(chalk.green('Синхронизировано'));
      });
    });
  });

program.parse(process.argv);
