<?php
require('aws.php');
require('cors.php');
cors();
use Aws\DynamoDb\Marshaler;
$marshaler = new Marshaler();
if(isset($_REQUEST['name'])){
  $first = explode(' ', $_REQUEST['name'], 2)[0];
  $last = explode(' ', $_REQUEST['name'], 2)[1];
  if(getUserPassword($first, $last) === null)
    http_response_code(404);
  else {
    echo getUserPassword($first, $last);
  }
}
?>
