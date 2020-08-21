<?php
require('aws.php');
require('cors.php');
cors();
echo json_encode(getUserData($_REQUEST['password']));
?>
