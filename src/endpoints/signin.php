<?php
require('sheets.php');
require('datafuncs.php');

$userData = getUserData("123");
$lastTime = (int) $userData[3];
$totalTime = (int) $userData[4];
$sessionTime = $totalTime+time()-$lastTime;
echo $sessionTime;

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  $userData = getUserData($_REQUEST['password']);
  $lastTime = (int) $userData[3];
  $totalTime = (int) $userData[4];
  $sessionTime = time() - $lastTime;
  echo $sessionTime;

  if($userData[2] == "FALSE"){
    $values = [
      ["TRUE", time(), $sessionTime]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));

    changeData($values, $range);

    echo $userData[0];
  } else if($userData[2] == "TRUE"){
    $values = [
      ["FALSE", time(), $sessionTime]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));

    changeData($values, $range);

    echo $userData[0];
  }
}

?>
