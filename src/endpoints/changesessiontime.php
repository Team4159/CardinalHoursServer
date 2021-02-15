<?php
require('aws.php');
require('cors.php');

cors();

if (isset($_REQUEST['password']) && isset($_REQUEST['endtime']) && isset($_REQUEST['newtime'])) {
  if(findSession($_REQUEST['password'], $_REQUEST['endtime']) === null){
    if ($userExists) {
      echo 'Session not found';
    }
    http_response_code(404);
  } else {
    updateSessionTime($_REQUEST['password'], $_REQUEST['endtime'], $_REQUEST['newtime']);
    echo $_REQUEST['newtime'];
  }
}

?>
