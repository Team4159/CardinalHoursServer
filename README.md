# CardinalHoursServer

## How2Run

Edit the credentials.php file to add your aws Access Key ID and Secret Access Key or export `AWS_KEY` for the Access Key ID and `AWS_SECRET_KEY` for the Secret Access Key.

If running under Apache install `libapache2-mod-php` and enable the endpoints by adding `/src/endpoints/*.php` to `/etc/apache2/mods-enabled/dir.conf`.
To use exports instead on Apache add the exports to `/etc/apache2/envvars`

For sheets access, in the root folder run `php src/endpoints/sheets.php` and paste the resulting authentication token from the redirect url to authenticate the Google Sheets api.

## Documentation


### Endpoints:

To add a user:
```
Path: src/endpoints/adduser.php
Parameters: username, password
Returns: 
  Success: Username
  Failure:  Returns code 404 if a user with the same password already exists, or the username or password was blank
```

To get the time:
```
Path: src/endpoints/gettime.php
Parameters: none
Returns: Unix time in seconds
```

To get data of a single user:
```
Path: src/endpoints/getuserdata.php
Parameters: password
Returns: 
  Success: Stringified json of all the requested user's data
  Failure: Returns code 404 if the user does not exist
  
JSON is in the format of
{
  "username": <String>, // The username of the user
  "signedIn": <bool>, // True if the user is signed in and false if they are not
  "totalTime": <int>, // Total time in seconds of all the sessions of the user (log in + log out)
  "password": <String>, // The password of the user
  "sessions": [ // An array containing each session of the user
    {
      "date": <String>, // When the session ended in unix time
      "did": <String>, // What the user reported to have done during that session, is blank if nothing was reported
      "time": <int>, // How long the session lasted
      "day": <String> // The day of the session in the format of Month.Day.Year
    }
  ]
}
```

To get data of all users:
```
Path: src/endpoints/getuserdata.php
Parameters: password
Returns: 
  Success: Stringified array of all users' data
  Failure: Returns code 404 if the user does not exist
  
Return data is in the format of
[
  user1,
  user2,
  user3,
  ...
]

Refer to the above example for the format of a single user's data, this data excludes the password and sessions attributes.
```

To change the password of a user
```
Path: src/endpoints/changepassword.php
Parameters: password, newpassword
Returns: 
  Success: The new password of the user
  Failure: Returns code 404 if the old password does not exist, the new password is taken, or the new or old passwords are blank
```

To sign a user in:
```
Path: src/endpoints/signin.php
Parameters: password
Returns: 
  Success: Username, nothing if they're already signed in
  Failure: Returns code 404 if the user does not exist
```

To sign a user out:
```
Path: src/endpoints/signout.php
Parameters: password
Returns: 
  Success: Username, nothing if they're already signed out
  Failure: Returns code 404 if the user does not exist
```
