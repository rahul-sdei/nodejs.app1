angular.module('myApp.chat').config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/chat/:uname', {
    templateUrl: function(params){ return 'partials/chat.html'; },
    controller: 'Chat'
  })
}]);
angular.module('myApp.chat').controller('Chat', ['$scope', '$http', '$routeParams', '$location', '$userState', function($scope, $http, $routeParams, $location, $userState) {
	$scope.tplSidebar = 'partials/sidebar.html';
    $scope.recipient = {};
    $scope.chats = [];
    $scope.formData = {};
   
    // when landing on the page, get data and show them      
    $userState.findUser(function(err, next){
    if (err) {
      return;
    }
    $scope.user = $userState.getData();
    console.log('$userState.findUser', $scope.user);
    next(null, function(){getRecipient()});
    });
    
  function getRecipient() {
  $http.get('/users/' + $routeParams.uname)
        .success(function(data) {
          $scope.recipient = data;
          getConversation();
          console.log(data);
        })
        .error(function(data) {
	  $location.path('home');
          console.log('Error: ' + data);
        });
    }
    
    function getConversation() {
    $http.get('/chats/' + $scope.user['uname'] + '/' + $scope.recipient['username'])
        .success(function(data) {
          $scope.chats = data;
          console.log(data);
        })
        .error(function(data) {
          console.log('Error: ' + data);
        });
    }
    
    $scope.sendChat = function() {
	var chatData = {
	  'creator': $scope.user['uname'],
	  'recipient': $scope.recipient['username'],
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
	  $http.post('/chats/', chatData)
	  .success(function(data) {
	    $scope.formData = {}; // clear the form so our user is ready to enter another
	    console.log(data);
	  })
	  .error(function(data) {
	    console.log('Error: ' + data);
	  });
	});
        
    };
}]);

angular.module('myApp.chat').filter('theDate', function(){
  return function(input) { 
    var theDate = new Date(input);
    return theDate.format('m M Y H.i');
  }
  });