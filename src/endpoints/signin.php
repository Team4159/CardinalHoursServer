<?php
require('aws.php');
require('cors.php');

cors();

function signIn($password){
  $userData = getUser(['password' => ['S' => $password]]);
  if(!$userData["signedIn"]["BOOL"]){
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
  if(getUser(['password' => ['S' => $_REQUEST['password']]]) === null)
    http_response_code(404);
  else
    signIn($_REQUEST['password']);
}
?>
