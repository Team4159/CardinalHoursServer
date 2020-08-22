<?php
  putenv('HOME=/home/ling');
  require '../../vendor/autoload.php';
  use Aws\DynamoDb\Marshaler;

  $sdk = new Aws\Sdk([
    'region'   => 'us-east-2',
    'version'  => 'latest',
    'credentials' => array(
      'key'=> getenv('AWS_KEY'),
      'secret'=> getenv('AWS_SECRET_KEY')
    )
  ]);

  $dynamodb = $sdk->createDynamoDb();
  $marshaler = new Marshaler();

  $tableName = 'Hours';

  // Might give you the requested user data if you pleased the god jeff besos
  function getUser($password){
    global $marshaler;
    global $tableName;
    global $dynamodb;
    $key = $marshaler->marshalJson('
      {
          "password": "' . $password . '"
      }
    ');
    $params = [
      'TableName' => $tableName,
      'Key' => $key
    ];
    try {
      $result = $dynamodb->getItem($params);
      return json_decode($marshaler->unmarshalJson($result['Item']), true);
    } catch (TypeError $e) {
      return null;
    }
  }

  // Might add a user, might not. 1 in 100000000000 chance to not work
  function addUser($username, $password){
    global $marshaler;
    global $tableName;
    global $dynamodb;

    $item = $marshaler->marshalJson('
      {
        "password": "'.$password.'",
        "username": "'.$username.'",
        "signedIn": '.false.',
        "lastTime": '.time().',
        "totalTime": 0,
        "sessions": [[]]
    ');
    $params = [
      'TableName' => $tableName,
      'Item' => $item
    ];
    $dynamodb->putItem($params);
  }

  function updateUser($password, $data){
    global $marshaler;
    global $tableName;
    global $dynamodb;

    $key = $marshaler->marshalJson('
      {
          "password": "' . $password . '"
      }
    ');

    $params = [
      'TableName' => $tableName,
      'Key' => $key,
      'UpdateExpression' => 
          'set sessions=:sessions, signedIn=:signedIn, lastTime=:lastTime, totalTime=:totalTime',
      'ExpressionAttributeValues'=> $data,
      'ReturnValues' => 'UPDATED_NEW'
    ];
    $dynamodb->updateItem($params);
  }
?>
