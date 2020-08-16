<?php
require __DIR__ . '/vendor/autoload.php';

/**
 * Returns an authorized API client.
 * @return Google_Client the authorized client object
 */
function getClient()
{
    $client = new Google_Client();
    $client->setApplicationName('Google Sheets API PHP Quickstart');
    $client->setScopes(Google_Service_Sheets::SPREADSHEETS);
    $client->setAuthConfig('credentials.json');
    $client->setAccessType('offline');
    $client->setPrompt('select_account consent');

    // Load previously authorized token from a file, if it exists.
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    $tokenPath = 'token.json';
    if (file_exists($tokenPath)) {
        $accessToken = json_decode(file_get_contents($tokenPath), true);
        $client->setAccessToken($accessToken);
    }

    // If there is no previous token or it's expired.
    if ($client->isAccessTokenExpired()) {
        // Refresh the token if possible, else fetch a new one.
        if ($client->getRefreshToken()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
        } else {
            // Request authorization from the user.
            $authUrl = $client->createAuthUrl();
            printf("Open the following link in your browser:\n%s\n", $authUrl);
            print 'Enter verification code: ';
            $authCode = trim(fgets(STDIN));

            // Exchange authorization code for an access token.
            $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);
            $client->setAccessToken($accessToken);

            // Check to see if there was an error.
            if (array_key_exists('error', $accessToken)) {
                throw new Exception(join(', ', $accessToken));
            }
        }
        // Save the token to a file.
        if (!file_exists(dirname($tokenPath))) {
            mkdir(dirname($tokenPath), 0700, true);
        }
        file_put_contents($tokenPath, json_encode($client->getAccessToken()));
    }
    return $client;
}


// Get the API client and construct the service object.
$client = getClient();
$service = new Google_Service_Sheets($client);

$spreadsheetId = '1GHouiwgCqaTOQ5Zy-VgzWdaAptYKhb3rV9k7EwKfI2g';
$data = $service->spreadsheets_values->get($spreadsheetId, 'Data')->getValues(); // Gets all relevant data from sheets

// Returns all the data from sheets
function getData($password){
  global $data;
  return json_encode($data);
}

// Gets data of a single user from sheets
function getUserData($password){
  global $data;
  if (empty($data)) {
    return 'Uh Oh. Something broke.\n';
  } else {
    $num = count($data);
    for ($i = 1; $i < $num; $i++) {
      if($data[$i][1] == $password)
        return $data[$i];
    }
    return '';
  }
}


// Adds a user to sheets
function addUser($name, $password){
  global $data;
  global $client;
  global $service;
  global $spreadsheetId;
  $range = ("A". (count($data) + 1)) . (":E" . (count($data) + 1));
  $values = [
    [
        $name, $password, FALSE, time(), 0
    ],
  ];

  $params = [
    'valueInputOption' => 'USER_ENTERED'
  ];

  $body = new Google_Service_Sheets_ValueRange([
    'values' => $values
  ]);

  $service->spreadsheets_values->update($spreadsheetId, $range, $body, $params);
}

// start tracking time on signin
if (isset($_REQUEST['signIn'])) {
  if(getUserData($_REQUEST['signIn'])[3] == FALSE){
    
  }
}

// returns data on get request
if (isset($_REQUEST['q'])) {
   echo getData($_REQUEST['q']);
}

if (isset($_REQUEST['createUser']) && isset($_REQUEST['passcode'])) {
  if(getUserData($_REQUEST['passcode']) == '' && $_REQUEST['createUser'] != '' && $_REQUEST['passcode'] != ''){
    addUser($_REQUEST['createUser'], $_REQUEST['passcode']);
    echo $_REQUEST['createUser'];
  } else
    echo 'User already exists';
}
?>
