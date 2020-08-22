<?php
require('aws.php');
require('cors.php');

$MAX_TIME = 43200; // 12 hours

cors();

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  $userData = getUser($_REQUEST['password']);
  $lastTime = $userData["lastTime"];
  $totalTime = $userData["totalTime"];
  $sessionTime = time() - $lastTime;
  if($userData["signedIn"]){
    $eav = array(
      'sessions' => array('L' => $userData["sessions"]),
      'signedIn' => array('BOOL' => false),
      'lastTime' => array('N' => strval(time())),
      'totalTime' => array('N' => strval($totalTime + ($sessionTime < $MAX_TIME ? $sessionTime : 0)))
    );
    updateUser($_REQUEST['password'], $eav);
    echo $userData["username"];
  } else {
    $eav = array(
      'sessions' => array('L' => $userData["sessions"]),
      'signedIn' => array('BOOL' => true),
      'lastTime' => array('N' => strval(time())),
      'totalTime' => array('N' => strval($userData["totalTime"]))
    );
    updateUser($_REQUEST['password'], $eav);
    echo $userData["username"];
  }
}

?>
