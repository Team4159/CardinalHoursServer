<?php
require('aws.php');
require('cors.php');

cors();

if (isset($_REQUEST['username']) && isset($_REQUEST['password'])) {
  if(getUser(['password' => ['S' => strval($_REQUEST['password'])]]) === null && $_REQUEST['username'] != '' && $_REQUEST['password'] != ''){
    addUser($_REQUEST['username'], $_REQUEST['password']);
    echo $_REQUEST['username'];
  } else
    http_response_code(404);
}

?>
