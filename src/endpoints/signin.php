<?php
require('sheets.php');
require('datafuncs.php');

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  $userData = getUserData($_REQUEST['password']);
  if($userData[2] == "FALSE"){
    $values = [
      ["TRUE", time(), (int) userData[4]]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));
    changeData($values, $range);
    echo $userData[0];
  } else if($userData[2] == "TRUE"){
    $values = [
      ["FALSE", time(), (int) userData[4] + time() - (int) userData[4]]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));
    changeData($values, $range);
    echo $userData[0];
  }
}

?>
