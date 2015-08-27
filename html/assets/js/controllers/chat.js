angular.module('myApp.chat').config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/chat/new/:uname', {
    templateUrl: function(params){ return 'partials/chat.html'; },
    controller: 'Chat',
    isNewChat: true
  })
  .when('/chat/:chat_id', {
    templateUrl: function(params){ return 'partials/chat.html'; },
    controller: 'Chat',
    isNewChat: false
  })
}]);
angular.module('myApp.chat').controller('Chat',
    ['$route', '$scope', '$http', '$routeParams', '$location', '$userState',
     function($route, $scope, $http, $routeParams, $location, $userState) {
	$scope.tplSidebar = 'partials/sidebar.html';
    $scope.recipient = {};
    $scope.chats = [];
    $scope.formData = {};
    
    var isNewChat = $route.current.$$route.isNewChat;
   
    // when landing on the page, get data and show them      
    $userState.findUser(function(err, next){
    if (err) {
      return;
    }
    $scope.user = $userState.getData();
    console.log('$userState.findUser', $scope.user);
    next(null, function(){getData()});
    });
    
    function getData() {
      if (isNewChat) {
	getRecipient();
      } else {
	getConversation();
      }
    }
  function getRecipient() {
  $http.get('/users/' + $routeParams.uname)
        .success(function(data) {
          $scope.recipient = data;
	  $scope.formTitle = 'Start chat with ' + data['username'];
          //getConversation();
          console.log(data);
        })
        .error(function(data) {
	  $location.path('search/history');
          console.log('Error: ' + data);
        });
    }
    
    function getConversation() {
    $http.get('/chats/' + $scope.user['uname'] + '/' + $routeParams.chat_id)
        .success(function(data) {
          console.log(data);
          $scope.chats = data['history'];
	  $scope.chatObject = data['chat'];
	  $scope.formTitle = 'Chat with ' + data['chat'] ['chat_name'];
        })
        .error(function(data) {
          console.log('Error: ' + data);
        });
    }
    
    $scope.sendChat = function() {
	var chatData = {
	  'creator': $scope.user['uname'],
	  'message': $scope.formData['text']
	  };
	chatData['date'] = Date.now();
	chatData['_id'] = getRandomInt(1, 9999);
	sendMessage(chatData, function(err) {
	  if (err) {
	    console.log('Error while sending chat');
	    return;
	  }
	  /* Send to web api */
	  var postUrl = null;
	  if (isNewChat) {
	    postUrl = '/chats/' + $scope.user['uname'] + '/' + $scope.recipient['username'];
	  } else {
	    postUrl = '/chats/' + $scope.user['uname'] + '/' + $routeParams.chat_id;
	  }
	  $http.post(postUrl, chatData)
	  .success(function(data) {
	    $scope.formData = {}; // clear the form so our user is ready to enter another
	    console.log(data);
	  })
	  .error(function(data) {
	    console.log('Error: ' + data);
	  });
	});  
    };
    
    $scope.removeRecipient = function(recipient) {
      console.log('Remove recipient:', recipient);
      removeArrValue($scope.chatObject.recipients, recipient);
    };
}]);

angular.module('myApp.chat').filter('theDate', function(){
  return function(input) { 
    var theDate = new Date(input);
    return theDate.format('m M Y H.i');
  }
  });