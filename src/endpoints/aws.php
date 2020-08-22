<?php
  putenv('HOME=/home/ling');
  require '../../vendor/autoload.php';
  use Aws\DynamoDb\Exception\DynamoDbException;

  $sdk = new Aws\Sdk([
    'region'   => 'us-east-2',
    'version'  => 'latest',
    'credentials' => array(
      'key'=> getenv('AWS_KEY'),
      'secret'=> getenv('AWS_SECRET_KEY')
    )
  ]);

  $dynamodb = $sdk->createDynamoDb();

  $tableName = 'Hours';

  // Might give you the requested user data if you pleased the god jeff besos
  function getUser($password){
    global $tableName;
    global $dynamodb;
    $key = array('password' => array('S' => $password));
    $params = [
      'TableName' => $tableName,
      'Key' => $key
    ];
    try {
      $result = $dynamodb->getItem($params);
      return $result['Item'];
    } catch (DynamoDbException $e) {
      return null;
    }
  }

  // Might add a user, might not. 1 in 100000000000 chance to not work
  function addUser($username, $password){
    global $tableName;
    global $dynamodb;
    $item = array(
      'password' => array('S' => strval($password)),
      'username' => array('S' => strval($username)),
      'lastTime' => array('N' => strval(time())),
      'totalTime' => array('N' => "0"),
      'signedIn' => array('BOOL' => false),
      'sessions' => array('L' => [])
    );
    $params = [
      'TableName' => $tableName,
      'Item' => $item
    ];
    $dynamodb->putItem($params);
  }

  function updateUser($password, $data){
    global $tableName;
    global $dynamodb;

    $key = array('password' => array('S' => $password));
    $params = [
      'TableName' => $tableName,
      'Key' => $key,
      'UpdateExpression' => 
          'set sessions=sessions, signedIn=signedIn, lastTime=lastTime, totalTime=totalTime',
      'ExpressionAttributeValues'=> $data,
      'ReturnValues' => 'UPDATED_NEW'
    ];
    $dynamodb->updateItem($params);
  }
?>
