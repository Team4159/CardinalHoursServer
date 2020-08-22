<?php
require('aws.php');
require('cors.php');
$MAX_TIME = 43200; // 12 hours

# cors();

function signIn($password, $did = ''){
  global $MAX_TIME;
  $userData = getUser($password);
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
      ':session' => [
        'M' => [
          'date' => ['S' => date("m.d.Y")],
          'time' => ['N' => strval($sessionTime)],
          'did' => ['S' => $did]
        ]
      ]
    ];

    updateUser($password, $data);
    echo $userData["username"]["S"];
  } else {
    $data = [
      ':signedIn' => ['BOOL' => true],
      ':lastTime' => ['N' => strval(time())],
      ':totalTime' => ['N' => $userData["totalTime"]["N"]]
    ];
    updateUser($password, $data);
    echo $userData["username"]["S"];
  }
}
// start tracking time on signin
if (isset($_REQUEST['password'])) {
  if(isset($_REQUEST['did']))
    signIn($_REQUEST['password'], $_REQUEST['did']);
  else
    signIn($_REQUEST['password']);
}
signIn("123", "nothing")
?>
