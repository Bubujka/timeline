<?php
// Routes

$app->get('/[{name}]', function ($req, $res, $args) {
  $t = $this->pdo->query('show tables')->fetchAll();
  return $res->withJson($t);
});

$app->get('/api/events', function ($req, $res, $args) {
  $data = $this->pdo->query('select `id`, `name`, unix_timestamp(`time`) as `time` from events')->fetchAll();
  return $res->withJson(array_map(function($itm){
    $itm['id'] = (int)$itm['id'];
    $itm['time'] = (int)$itm['time'];
    $itm['is_user'] = true;
    return $itm;
  }, $data));
});

$app->get('/api/events/types', function ($req, $res, $args) {
  return $res->withJson($this->pdo->query('select distinct `name` from events')->fetchAll());
});
$app->post('/api/events', function ($req, $res, $args) {
  $b = $req->getParsedBody();
  $name = $b['name'];
  if(isset($b['time'])){
    $time = (int)$b['time'];
  }else{
    $time = time();
  }
  $this
    ->pdo
    ->prepare('insert into events(`name`, `time`, `created_at`) values (?, from_unixtime(?), now())')
    ->execute([$b['name'], $time]);
  return $res->withJson(true);
});
