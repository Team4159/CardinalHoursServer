<?php
require('sheets.php');
require('cors.php');

if (isset($_REQUEST['username']) && isset($_REQUEST['password'])) {
  if(getUserData($_REQUEST['password']) === null && $_REQUEST['username'] != '' && $_REQUEST['password'] != ''){
    addUser($_REQUEST['username'], $_REQUEST['password']);
    echo $_REQUEST['username'];
  } else
    echo 'User already exists';
}

?>
