<?php
require('sheets.php');
require('datafuncs.php');

// Adds a user to sheets
function addUser($name, $password){
  global $data;
  $range = ("A". (count($data) + 1)) . (":E" . (count($data) + 1));
  $values = [
    [
        $name, $password, FALSE, time(), 0
    ],
  ];
  changeData($values, $range);
}


if (isset($_REQUEST['username']) && isset($_REQUEST['password'])) {
  if(getUserData($_REQUEST['password']) === null && $_REQUEST['username'] != '' && $_REQUEST['password'] != ''){
    addUser($_REQUEST['username'], $_REQUEST['password']);
    echo $_REQUEST['username'];
  } else
    echo 'User already exists';
}

?>
