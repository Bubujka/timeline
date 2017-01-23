#!/usr/bin/env node

'use strict';

const program = require('commander');
const request = require('request');
const chalk = require('chalk');
const et = require('expand-tilde');
const fs = require('fs');
const glob = require('glob');
const async = require('async');
const PB = require('progress');
const _ = require('underscore');
const notifier = require('node-notifier');


const cfg = require(et('~/.butl.json')); // eslint-disable-line

const SERVER = 'http://timeline.najomi.org';
const SYNC_LIMIT = 10;

const Api = {
  getTypes(cb) {
    request.get(`${SERVER}/api/events/types`, { auth: cfg.auth }, (err, res, body) => {
      if (err) {
        return cb(err);
      }
      cb(null, _.chain(JSON.parse(body)).pluck('name').sort().value());
    });
  },
};

const Local = {
};

function print(t) {
   console.log(t); // eslint-disable-line
}

function notify(message) {
  notifier.notify({
    title: 'Timeline:',
    message,
  });
}

program.version('0.0.1');
program
  .command('checklogin <user> <pass>')
  .action((user, pass) => {
    request
      .get(SERVER, (err, res) => {
        if (err) {
          throw err;
        }

        if (res.statusCode === 200) {
          print(chalk.green('Пароль подходит для сервера'));
        } else {
          print(chalk.red('Что-то ты не угадал +_+'));
        }
      })
      .auth(user, pass);
  });

program
  .command('savelogin <user> <pass>')
  .action((user, pass) => {
    const pth = et('~/.butl.json');

    fs.writeFile(pth, JSON.stringify({ auth: { user, pass } }, null, 2), (err) => {
      if (err) {
        throw err;
      }
      print(chalk.green(`Пароль сохранён в файл "${pth}"`));
    });
  });

function ensureDataDirectoryExists(next) {
  const pth = et('~/.butl');
  fs.stat(pth, (err) => {
    if (err) {
      fs.mkdir(pth, (err) => {
        if (err) {
          throw err;
        }
        next();
      });
    } else {
      next();
    }
  });
}
program
  .command('event <name>')
  .action((name) => {
    ensureDataDirectoryExists(() => {
      const t = (new Date()).getTime();
      const pth = et(`~/.butl/${t}.json`);
      const time = Math.floor(t / 1000);
      fs.writeFile(pth, JSON.stringify({ time, name }, null, 2), (err) => {
        if (err) {
          throw err;
        }
        notify(name);
      });
    });
  });


program
  .command('types')
  .action(() => {
    Api.getTypes((err, types) => {
      if (err) {
        throw err;
      }

      print(chalk.green('Активности что уже есть в базе:'));
      print(types.map(s => `- ${s}`).join('\n'));
    });
  });


program
  .command('sync')
  .action(() => {
    const pth = et('~/.butl/*');
    glob(pth, (err, files) => {
      if (err) {
        throw err;
      }
      if (!files.length) {
        print(chalk.green('Всё синхронизировано'));
      } else {
        const bar = new PB(':current/:total [:bar] :percent :eta s.', { total: files.length, width: 50 });

        async.eachLimit(files, SYNC_LIMIT, (file, next) => {
          fs.readFile(file, (err, buffer) => {
            if (err) {
              return next(err);
            }
            try {
              const data = JSON.parse(buffer);
              request.post(`${SERVER}/api/events`, { formData: data, auth: cfg.auth }, (err, res) => {
                if (err) {
                  return next(err);
                }
                if (res.statusCode !== 200) {
                  return next(new Error(`Сервер ответил ${res.statusCode} ответом на файл ${file}`));
                }

                return fs.unlink(file, (err) => {
                  if (err) {
                    next(err);
                  } else {
                    bar.tick();
                    next();
                  }
                });
              });
            } catch (e) {
              next(e);
            }
          });
        }, (err) => {
          if (err) {
            throw err;
          }
          notify('Синхронизировал =)')
        });
      }
    });
  });

program.parse(process.argv);
