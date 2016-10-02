<?php
// Routes

$app->get('/[{name}]', function ($req, $res, $args) {
  $t = $this->pdo->query('show tables')->fetchAll();
  return $res->withJson($t);
});
