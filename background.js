function show(msg) {
  var group = Groups.find(msg.subject.group_id);
  Notifications.addNotification({
    id: group.id,
    name: group.name,
    url: "https://app.groupme.com/chats/" + group.id,
    image: group.image_url  || "http://i.groupme.com/300x300.png.e8ec5793a332457096bc9707ffc9ac37"
  },{
    name: msg.subject.name,
    image: msg.subject.avatar_url,
    text: msg.subject.text
  });
}
chrome.storage.sync.get("token", function(items){
  if (items.token){
    setUpSocket(items.token);
  } else {
    Auth.getToken();
  }
});
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method == "setToken"){
    chrome.storage.sync.set({'token': request.value}, function() {
      sendResponse({data: "Token set"});
    });
  }
});

var client = null;
chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    if (key === "token"){
      if (changes[key].newValue){
        client = setUpSocket(changes[key].newValue);
      } else {
        // The user logged out
        client.disconnect();
        client = null;

        Notifications.showSimpleNotification({
          title: "Logged Out",
          text: "You have logged out of GroupMe"
        });
      }
    }
  }
});
getUserInfo = function(token, cb){
  var request = new XMLHttpRequest();
  request.open('GET', 'https://api.groupme.com/v3/users/me?token='+token, true);
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var resp = request.responseText;
      cb(JSON.parse(resp).response);
    }
  };
  request.send();
};
setUpSocket = function(token){
  getUserInfo(token,function(user){
    subscribe(user.id);
  });
  Groups.load(token);
  var client = new Faye.Client('https://push.groupme.com/faye');

  chrome.storage.sync.get("hide-auth-notif", function(result){
    if (!result['hide-auth-notif']){
      Notifications.showSimpleNotification({
        title: "Logged In",
        text: "You have successfully logged in to GroupMe"
      });
    }
  });

  client.addExtension({
    outgoing: function(message, callback){
      if (message.channel !== '/meta/subscribe'){
        return callback(message);
      }
      message.ext = message.ext || {};
      message.ext.access_token = token;
      message.ext.timestamp = Date.now()/1000 |0;
      callback(message);
    }
  });
  var subscribe = function(uid){
    var subscription = client.subscribe('/user/'+uid, function(message) {
      if (message.type === "line.create" &&
          message.subject.sender_id !== uid){
        show(message);
      }
    });
  };
  return client;
};
