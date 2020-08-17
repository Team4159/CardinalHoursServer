// Attempts to sign in with cookie if it exists
if(Cookies.get('password') != undefined)
  signIn(Cookies.get('password'));

// Filters user data from all data
function filterUserData(password, data){
  for(let i = 1; i < data.length; i++){
    if(data[i][1] == password)
      return data[i];
  }
}

// Triggers the signin call for the server
async function signIn(password){
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = async function() {
    if (this.readyState == 4 && this.status == 200) {
      console.log(this.responseText);
      if(this.responseText == undefined)
        $('#message').text("User not found");
      else
        $('#message').text('Welcome, ' + this.responseText);
      Cookies.set('password', password);
      let data = await getData();
      showData(data);
      showUsers(data);
    }
  }

  xmlhttp.open('GET', 'src/endpoints/signin.php?password=' + password, true);
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
    xmlhttp.open('GET', 'src/endpoints/getdata.php', true);
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
function createUser(name, password) {
  if(name != "" && password != ""){
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        alert(this.responseText == 'User already exists' ? this.responseText : 'Successfully added user ' + this.responseText);
      }
    }
    xmlhttp.open('GET', 'src/endpoints/adduser.php?username=' + name + '&password=' + password, true);
    xmlhttp.send();
  }
}
