angular.module('myApp.search').config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/search', {
    templateUrl: 'partials/search.html',
    controller: 'Search'
  })
  .when('/search/:action', {
    templateUrl: function(params){ 
        return 'partials/' + params.action + '.html';
    },
    controller: 'Search'
  })
}]);

angular.module('myApp.search').controller('Search',
    ['$scope', '$http', '$routeParams', '$location', '$userState', '$localStorage',
     function($scope, $http, $routeParams, $location, $userState, $localStorage) {
    $scope.tplSidebar = 'partials/sidebar.html';
    $scope.users = [];
    $scope.chats = {};
    
    // when landing on the page, get data and show them      
    $userState.findUser(function(err, next){
    if (err) {
      return;
    }
    $scope.user = $userState.getData();
    console.log('$userState.findUser', $scope.user);
    next(null, function(){getContacts();});
    });
    
    function getContacts() {
      var dataUrl = '/users?limit=0';
      if ( $routeParams.action=='mycontacts' ) {
        dataUrl = '/users/'+$scope.user['uname']+'/contacts';
      } else if ( $routeParams.action=='history' ) {
        dataUrl = '/chats/'+$scope.user['uname']+'';
      }
      
      $http.get(dataUrl)
      .success(function(data) {
        $scope.users = data['data'];
        $scope.orderProp = 'username';
        if ( typeof data['chats'] !== 'undefined' ) {
            $scope.chats = data['chats'];
        }
        console.log(data);
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
    }
    
    $scope.deleteUser = function(uid) {
        if ( $scope.user.is_admin !== true ) { return ; }
        $http.delete('/users/' + uid)
        .success(function(data) {
          console.log(data);
        })
        .error(function(data) {
          console.log('Error: ' + data);
        });
    }
    
    $scope.addContact = function(uid) {
      $http.post('/users/' + $scope.user['uname'] + '/contacts', { 'ulist': [ uid ] })
      .success(function(data) {
	console.log(data);
	/* add new contact to $scope */
	$scope.user['contacts'].push(uid);
      })
      .error(function(data) {
	console.log('Error: ' + data);
      });
    };
    
    $scope.removeContact = function(uid) {
      $http.delete('/users/' + $scope.user['uname'] + '/contacts/' + uid)
      .success(function(data) {
	console.log(data);
	/* remove contact from $scope */
	for(i in $scope.user['contacts']) {
	  if ($scope.user['contacts'] [i] === uid) {
	    delete $scope.user['contacts'] [i];
	  }
	}
	/* remove relevant html block */
	jQuery('#contact_' + uid).remove();
      })
      .error(function(data) {
	console.log('Error: ' + data);
      });
    };
    
    $scope.deleteChat = function(recipient) {
      $http.delete('/chats/' + $scope.user['uname'] + '/' + recipient)
      .success(function(data) {
	console.log(data);
	/* remove relevant html block */
	jQuery('#history_' + recipient).remove();
      })
      .error(function(data) {
	console.log('Error: ' + data);
      });
    }
    
     $scope.redirect = function ( path ) {
        $location.path( path );
      };
}]);

angular.module('myApp.search').filter('toString', function(){
  return function(input) { 
    return input.sort().toString();
  }
  });