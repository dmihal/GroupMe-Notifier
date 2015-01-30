Groups = {
  load : function(token){
    var self = this;
    var request = new XMLHttpRequest();
    request.open('GET', 'https://api.groupme.com/v3/groups?token='+token, true);
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        var groups = JSON.parse(request.responseText).response;
        groups.forEach(function(group){
          self.values[group.id] = group;
        });
      }
    };
    request.send();
  },
  find: function(id){
    return this.values[id];
  },
  values: {}
};
