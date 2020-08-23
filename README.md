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
src/endpoints/adduser.php
parameters: username, password
returns: Username on success and 'User already exists' if a user with the same password already exists
```

To get the time:
```
src/endpoints/gettime.php
parameters: none
returns: Unix time in seconds
```

To get data of a single user:
```
src/endpoints/getuserdata.php
parameters: password
returns: stringified json of all the requested user's data
JSON is in the format of
{
  "signedIn": <bool>, // True if the user is signed in and false if they are not
  "totalTime": <int>, // Total time in seconds of all the sessions of the user (log in + log out)
  "password": <String>, // The password of the user
  "sessions": [ // An array containing each session of the user
    {
      "date": <String>, // When the session ended in unix time
      "did": <String>, // What the user reported to have done during that session, is blank if nothing was reported
      "time": <int>, // How long the session lasted
    }
  ]
}
```

To sign a user in:
```
src/endpoints/signin.php
parameters: password
returns: 
  Success: Username, nothing if they're already signed in
  Failure: 'User does not exist'
```

To sign a user out:
```
src/endpoints/signout.php
parameters: password
returns: 
  Success: Username, nothing if they're already signed out
  Failure: 'User does not exist'
```
