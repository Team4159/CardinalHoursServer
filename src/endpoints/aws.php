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
    $key = ['password' => ['S' => strval($password)]];
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
    $item = [
      'password' => ['S' => strval($password)],
      'username' => ['S' => strval($username)],
      'lastTime' => ['N' => strval(time())],
      'totalTime' =>['N' => "0"],
      'signedIn' => ['BOOL' => false],
      'sessions' => ['L' => []]
    ];
    $params = [
      'TableName' => $tableName,
      'Item' => $item
    ];
    $dynamodb->putItem($params);
  }

  // Handle sessions seperately because of their funky format
  function addSession($password, $session){
    global $tableName;
    global $dynamodb;

    $key = ['password' => ['S' => strval($password)]];
    $params = [
      'TableName' => $tableName,
      'Key' => $key,
      'UpdateExpression' => 
        'set #sessions = list_append(if_not_exists(#sessions, :empty_list), :session)',
      'ExpressionAttributeNames' => ["#sessions" => "sessions"],
      'ExpressionAttributeValues' => $session
    ];
    $dynamodb->updateItem($params);
  }

  // Updates the user to windows 10
  function updateUser($password, $data){
    global $tableName;
    global $dynamodb;

    $key = ['password' => ['S' => strval($password)]];
    $params = [
      'TableName' => $tableName,
      'Key' => $key,
      'UpdateExpression' => 
          'set signedIn=:signedIn, lastTime=:lastTime, totalTime=:totalTime',
      'ExpressionAttributeValues'=> $data
    ];
    $dynamodb->updateItem($params);
  }
?>
