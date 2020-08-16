// Attempts to sign in with cookie if it exists
if(Cookies.get('password') != undefined)
  signIn(Cookies.get('password'));

// Filters user data from all data
function filterUserData(passcode, data){
  for(let i = 1; i < data.length; i++){
    if(data[i][1] == passcode)
      return data[i];
  }
  return '';
}

// Triggers the signin call for the server
async function signIn(passcode){
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = async function() {
    if (this.readyState == 4 && this.status == 200) {
      let data = await getData();
      let user = filterUserData(passcode, data);
      if(user == '')
        $('#message').text("User not found");
      else
        $('#message').text('Welcome, ' + user[0]);
      Cookies.set('password', passcode);
      showData(data);
      showUsers(data);
    }
  }

  xmlhttp.open('GET', 'sheets.php?signIn='+passcode, true);
  xmlhttp.send();
}

// Gets all the data from the server
async function getData() {
  return new Promise(function (resolve, reject) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        resolve(JSON.parse(this.responseText));
      }
    }
    xmlhttp.open('GET', 'sheets.php?q='+passcode, true);
    xmlhttp.send();
  });
}

// Shows the signed in users's data
function showData(data){

}

// Shows and updates all users signed in
function showUsers(data){

}

// Sends a request to create a new user
function createUser(name, passcode) {
  if(name != "" && passcode != ""){
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        alert(this.responseText == 'User already exists' ? this.responseText : 'Successfully added user ' + this.responseText);
      }
    }
    xmlhttp.open('GET', 'sheets.php?createUser=' + name + '&passcode=' + passcode, true);
    xmlhttp.send();
  }
}
