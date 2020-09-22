<?php
require('syncsheets.php');
require('cors.php');
$MAX_TIME = 43200; // 12 hours

cors();

function signOut($password, $did = '', $sessionTime){
  global $MAX_TIME;
  $userData = getUser(['password' => ['S' => $password]]);
  $lastTime = $userData["lastTime"]["N"];
  $totalTime = $userData["totalTime"]["N"];
  $now = time();
  if ($sessionTime && is_numeric($sessionTime)) {
    $sessionTime = intval($sessionTime);
    $date = $lastTime + $sessionTime;
  } else {
    $sessionTime = $now - $lastTime;
    $date = $now;
  }
  if($userData["signedIn"]["BOOL"]){
    $data = [
      ':signedIn' => ['BOOL' => false],
      ':lastTime' => ['N' => strval(time())],
      ':totalTime' => ['N' => strval($totalTime + ($sessionTime < $MAX_TIME ? $sessionTime : 0))]
    ];

    $session = [
      ':empty_list' => ['L'=>[]],
      ':session' => [
        'L' => [
          [
            'M' => [
              'date' => ['S' => strval($date)],
              'time' => ['N' => strval($sessionTime)],
              'did' => ['S' => strval($did)],
              'day' => ['S' => date("m/d/Y")],
              'flagged' => ['BOOL' => $sessionTime > $MAX_TIME]
            ]
          ]
        ]
      ]
    ];

    updateUser($password, $data);
    addSession($password, $session);
    echo $userData["username"]["S"];
    syncUser($password);
  }
}

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  if(getUser(['password' => ['S' => strval($_REQUEST['password'])]]) === null){
    http_response_code(404);
  } else {
    signOut($_REQUEST['password'], $_REQUEST['did'], $_REQUEST['sessionTime']);
  }
}
?>
