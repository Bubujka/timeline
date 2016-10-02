<?php
// Application middleware

// e.g: $app->add(new \Slim\Csrf\Guard);
//
$users = [];
$users[getenv('FIRST_USER')] = getenv('FIRST_USER_PASSWORD');

if(getenv('DISABLE_AUTH') !== 'true'){
  $app->add(new \Slim\Middleware\HttpBasicAuthentication([
    "secure" => false,
    "users" => $users
  ]));
}
