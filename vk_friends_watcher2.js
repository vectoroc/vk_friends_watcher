/**
  * @author vectoroc
  *
  * Vkontatke friends watcher
  * screenshot http://skitch.com/vectoroc/dtrr4/
  *
  **/
if (!window.localStorage || !window.JSON) {
  var error = 'You use unsupported browser';
  alert('You use unsupported browser');
  throw error; 
}
  
  
(function() {
  var NS = 'vk_friends_watcher_'; 
  var storage = {
    history : JSON.parse(localStorage.getItem(NS + 'history')) || [],
    friends  : JSON.parse(localStorage.getItem(NS + 'friends')) || {},
    
    flush : function() {
      localStorage.setItem(NS + 'history', JSON.stringify(this.history));
      localStorage.setItem(NS + 'friends', JSON.stringify(this.friends));    
    }
  }
  
  function markDeleted(friend) {
//    console.info('deleted friend', friend);
    storage.friends[friend.id].deleted = true;
    storage.history.push({event : 'deleted', data: friend.id, time: Date.now()});
  }

  function markAdded(friend) {
//    console.info('added friend', friend);
    storage.history.push({type : 'added', data: friend.id, time: Date.now()});
    storage.friends[friend.id] = friend;
  }
  
  function parseVkJsonFriends(responseText) {
    var result = {};
    var data = eval('('+ responseText +')');
    for (var i = 0; i < data.friends.length; i++) {
      result[data.friends[i][0]] = {
        id: data.friends[i][0], 
        name: data.friends[i][1], 
        ava: data.friends[i][2]
      };
    } 
    
    return result; 
  }
  
  function _getMessageBox() {
    if (!_getMessageBox._mb) {
      _getMessageBox._mb = new MessageBox({title: 'History'});
    }
    return _getMessageBox._mb;
  }
  
  function _substitute(tpl, params) {
    for (var key in params) {
      tpl = tpl.replace('#{' + key + '}', params[key]);
    }
    return tpl;
  }  
  
  function showHistory() {
    var result = [], mb = _getMessageBox();
    var rowTpl = [
      '<table>',
        '<tr>',
          '<td rowspan="3">',
            '<img height=40 width=40 src="#{ava}"/>',
          '</td>',
          '<td>',
            '<a href="http://vk.com/id#{id}">#{name}</a>',
          '</td>',
        '</tr>',
        '<tr>',
          '<td style="color: gray">',
            '#{action} #{date}',
          '</td>',
        '</tr>',
        '<tr><td>&nbsp;</td></tr>',
      '</table>'
    ].join('');

    result.push('<div style="overflow-y: scroll; height: 300px">');    
        
    for (var i = storage.history.length - 1; i >= 0; i--) {
      var event  = storage.history[i];
      var friend = storage.friends[event.data];
      var params = clone(friend);
      
      params.date = new Date(event.time).toLocaleDateString();
      if (event.type == 'added') 
        params.action = 'Добавлен';
      else 
        params.action = 'Удален';
       
      result.push(_substitute(rowTpl, params));
    }
    
    if (storage.history.length == 0) {
      result.push('<span style="color: gray">Нет никаких записей</span>');
    }
    
    result.push('</div>');
    
    mb.addButton({label: 'Ok', onClick: function(){mb.hide();}});
    mb.addButton({label: 'Сlear', onClick: function(){
      storage.history = [];
      storage.flush();
      mb.hide();
    }});
    mb.content(result.join(''));
    mb.show();
  } 
  
  function showLoader() {
    _getMessageBox()
      .content('<div class="box_loader"></div>')
      .show();
  }  

  showLoader();
  Ajax.Get({url:'friends.php',onDone: function(ajaxObj,responseText){ 
    var friends_remote = parseVkJsonFriends(responseText);

//  console.info('loaded friends', friends_remote);
//  console.info('friends', storage);

    for (var id in storage.friends) {
      if (!friends_remote[id] && !storage.friends[id].deleted) 
        markDeleted(storage.friends[id]);
    }

    for (var id in friends_remote) {
      if (!storage.friends[id] || storage.friends[id].deleted)
        markAdded(friends_remote[id]);
    }
//  console.dir(storage);
    showHistory();
    storage.flush();
  }});

})();