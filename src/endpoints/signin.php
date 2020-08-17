<?php
require('sheets.php');
require('datafuncs.php');

$MAX_TIME = 43200; // 12 hours

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  $userData = getUserData($_REQUEST['password']);
  $lastTime = (int) $userData[3];
  $totalTime = (int) $userData[4];
  $sessionTime = time() - $lastTime;

  if($userData[2] == "FALSE"){
    $values = [
      ["TRUE", time(), $totalTime]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));
    changeData($values, $range);
    echo $userData[0];
  } else if($userData[2] == "TRUE"){
    $values = [
      ["FALSE", time(), $totalTime + $sessionTime < $MAX_TIME ? $sessionTime : 0]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));
    changeData($values, $range);
    echo $userData[0];
  }
}

?>
