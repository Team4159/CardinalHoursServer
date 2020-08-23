<?php
require('aws.php');
require('cors.php');

if (isset($_REQUEST['username']) && isset($_REQUEST['password'])) {
  if(getUser($_REQUEST['password']) === null && $_REQUEST['username'] != '' && $_REQUEST['password'] != ''){
    addUser($_REQUEST['username'], $_REQUEST['password']);
    echo $_REQUEST['username'];
  } else
    http_response_code(404);
}

?>
