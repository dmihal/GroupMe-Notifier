Notifications = (function(){
  var notifications = {};

  function _notification(group){
    this.id = "";
    this.groupId = group.id || "";
    this.messages = [];
    this.title = group.name || "GroupMe";
    this.image = group.image;
  }
  _notification.prototype.addMessage = function(msg){
    this.messages.push(msg);
  };
  _notification.prototype.render = function(){
    var self = this;
    var options = {
      title: this.title
    };
    if (this.messages.length > 1){
      var items = [];
      for (var i = this.messages.length - 1; i >= 0; i--){
        var message = this.messages[i];
        items.push({
          title: message.name,
          message: message.text
        });
      }
      options.items = items;

      options.type = "list";
      options.iconUrl = this.image;
    } else {
      var message = this.messages[0];
      options.type = "basic";
      options.title = message.name;
      options.message = message.text;
      options.iconUrl = message.image;
    }
    chrome.notifications.create(this.id, options, function(id){
      self.id = id;
    });
    this.setTimer(10);
  };
  _notification.prototype.setTimer = function(seconds){
    if (this._timer){
      clearTimeout(this._timer);
    }
    var self = this;
    this._timer = setTimeout(function(){
      self.close();
    }, seconds * 1000);
  };
  _notification.prototype.close = function(){
    chrome.notifications.clear(this.id, function(){});
    delete notifications[this.groupId];
  };


  return {
    addNotification: function(group, message){
      var notification = notifications[group.id] || new _notification(group);
      notification.addMessage(message);
      notification.render();
      notifications[group.id] = notification;
    }
  };
})();
