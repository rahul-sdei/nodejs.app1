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
    $scope.chatId = null;
    $scope.formData = {};
    $scope.states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Dakota', 'North Carolina', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
    
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
	$scope.chatId = $routeParams.chat_id;
	console.log('ChatId:',$scope.chatId);
	setChatId($scope.chatId);
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
          $scope.chatObject.recipients.removeVal($scope.user['uname']);
          console.log($scope.chatObject.recipients);
          $scope.formTitle = 'Chat with ' + data['chat'] ['chat_name'];
        })
        .error(function(data) {
	  $location.path('search/history');
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
	    console.log(data);
	  })
	  .error(function(data) {
	    console.log('Error: ' + data);
	  });
	});
	
	$scope.chatForm.$setUntouched();
	$scope.formData = {}; // clear the form so our user is ready to enter another
    };
    
    $scope.addRecipient = function() {
      var recipients = $scope.formData['recipients']
       .split(',')
       .map(function(input){
        return input.trim();
        }),
       postData = {'recipients': recipients};
      console.log('Adding recipients:', recipients);
      $http.post('/chats/' + $scope.user['uname'] + '/' + $routeParams.chat_id + '/recipients', postData)
       .success(function(data){
        console.log(data);
       })
       .error(function(data) {
        console.log('Error: ' + data);
       });
       
      $scope.chatForm2.$setUntouched();
      $scope.formData = {}; // clear the form so our user is ready to enter another
      $scope.chatObject.recipients = $scope.chatObject.recipients.concat(recipients);
    }
    
    $scope.removeRecipient = function(recipient) {
      console.log('Remove recipient:', recipient);
      $http.delete('/chats/' + $scope.user['uname'] + '/' + $routeParams.chat_id + '/recipients/' + recipient)
        .success(function(data){
        console.log(data);
       })
       .error(function(data) {
        console.log('Error: ' + data);
       });
      $scope.chatObject.recipients.removeVal(recipient);
    };
}]);

angular.module('myApp.chat').filter('theDate', function(){
  return function(input) { 
    var theDate = new Date(input);
    return theDate.format('d M Y H.i');
  }
  });