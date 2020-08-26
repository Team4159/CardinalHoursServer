<?php
require('aws.php');
require('cors.php');

cors();

if (isset($_REQUEST['newpassword']) && isset($_REQUEST['password'])) {
  if(getUser($_REQUEST['newpassword']) === null && getUser($_REQUEST['password']) != null && $_REQUEST['newpassword'] != '' && $_REQUEST['password'] != ''){
    changePassword($_REQUEST['password'], $_REQUEST['newpassword']);
    echo $_REQUEST['newpassword'];
  } else
    http_response_code(404);
}

?>
