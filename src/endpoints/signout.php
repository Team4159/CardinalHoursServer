<?php
require('cors.php');
require('syncsheets.php');
$MAX_TIME = 43200; // 12 hours
$MIN_TIME = 1;  // 1 second

cors();

function signOut($password, $did = ''){
  global $MAX_TIME;
  global $MIN_TIME;

  $userData = getUser(['password' => ['S' => $password]]);
  $lastTime = $userData["lastTime"]["N"];
  $totalTime = $userData["totalTime"]["N"];
  $sessionTime = time() - $lastTime;
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
              'date' => ['S' => strval(time())],
              'time' => ['N' => strval($sessionTime)],
              'did' => ['S' => strval($did)],
              'day' => ['S' => date("m/d/Y")],
              'flagged' => ['BOOL' => $sessionTime > $MAX_TIME]
            ]
          ]
        ]
      ]
    ];
    if($sessionTime > $MIN_TIME){
      updateUser($password, $data);
      addSession($password, $session);
      echo $userData["username"]["S"];
      syncUser($password);
    }
  }
}

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  if(getUser(['password' => ['S' => strval($_REQUEST['password'])]]) === null){
    http_response_code(404);
  } else {
    if(isset($_REQUEST['did']))
      signOut($_REQUEST['password'], $_REQUEST['did']);
    else
      signOut($_REQUEST['password']);
  }
}

?>
