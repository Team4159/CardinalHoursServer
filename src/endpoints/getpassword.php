<?php
require('aws.php');
require('cors.php');
cors();
use Aws\DynamoDb\Marshaler;
$marshaler = new Marshaler();
if(isset($_REQUEST['name'])){
  if(getUserPassword($_REQUEST['name']) === null)
    http_response_code(404);
  else {
    echo getUserPassword($_REQUEST['name']);
  }
}
?>
