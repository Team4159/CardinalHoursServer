<?php
require('aws.php');
require('cors.php');
cors();
use Aws\DynamoDb\Marshaler;
$marshaler = new Marshaler();
if(isset($_REQUEST['password'])){
  if(getUser($_REQUEST['password']) === null)
    http_response_code(404);
  else
    echo json_encode($marshaler->unmarshalItem(getUser($_REQUEST['password'])));
}
?>
