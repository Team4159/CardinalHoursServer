<?php
require('aws.php');
require('cors.php');
cors();
echo json_encode(getUser($_REQUEST['password']));
?>
