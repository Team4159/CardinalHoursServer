<?php
require('aws.php');
require('cors.php');
cors();
use Aws\DynamoDb\Marshaler;
$marshaler = new Marshaler();
$data = getData();
if($data === null)
  http_response_code(404);
else {
  foreach($data["Items"] as $user){
    $users[] = ($marshaler->unmarshalItem($user));
  }
  echo json_encode($users);
}
?>
