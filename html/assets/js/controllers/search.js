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
    
    function getContacts(nextUrl) {
      var dataUrl = null;
      if (nextUrl) {
	dataUrl = nextUrl;
      } else {
	dataUrl = '/users?limit=3';
	if ( $routeParams.action=='mycontacts' ) {
	  dataUrl = '/users/'+$scope.user['uname']+'/contacts';
	} else if ( $routeParams.action=='history' ) {
	  dataUrl = '/chats/'+$scope.user['uname']+'';
	}	
      }
      
      $http.get(dataUrl)
      .success(function(data, status, headers, config) {
	var results = [];
	results.data = data;
	results.headers = headers();
	results.status = status;
	results.config = config;
	console.log(results);
	
	
	if (nextUrl) {
	  $scope.users = jQuery.merge(jQuery.merge([], $scope.users), data['data']);
	} else {
	  $scope.users = data['data'];
	}
        //$scope.orderProp = 'username';
        if ( typeof data['chats'] !== 'undefined' ) {
            $scope.chats = data['chats'];
        }
	
	if (typeof results.headers['link'] !== 'undefined') {
	  var links = parseLinkHeader(results.headers['link']);
	  $scope.nextUrl = false;
	  if ( links['last']!==links['curr'] ) {
	    $scope.nextUrl = links['next'];
	  }
	}
	
	/*if (jQuery('#users_list').exists()) {
	jQuery('html, body').animate({ scrollTop: $('#users_list:last').offset().top }, 'slow');
	}*/
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
    }
    
    $scope.nextPage = function() {
      getContacts($scope.nextUrl);
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
    
    $scope.addContact = function(uname) {
      $http.post('/users/' + $scope.user['uname'] + '/contacts', { 'ulist': [ uname ] })
      .success(function(data) {
	console.log(data);
	/* add new contact to $scope */
	$scope.user['contacts'].push(uname);
      })
      .error(function(data) {
	console.log('Error: ' + data);
      });
    };
    
    $scope.removeContact = function(uname) {
      $http.delete('/users/' + $scope.user['uname'] + '/contacts/' + uname)
      .success(function(data) {
	console.log(data);
	/* remove contact from $scope */
	$scope.user['contacts'].removeVal(uname);
	for (var i in $scope['users']) {
	  if ($scope['users'][i]['username'] === uname) {
	    $scope['users'].splice(i, 1);
	  }
	}
      })
      .error(function(data) {
	console.log('Error: ' + data);
      });
    };
    
    $scope.deleteChat = function(chatId) {
      $http.delete('/chats/' + $scope.user['uname'] + '/' + chatId)
      .success(function(data) {
	console.log(data);
	/* remove relevant html block */
	for (var i in $scope['chats']) {
	  if ($scope['chats'][i]['chat_id'] === chatId) {
	    $scope['chats'].splice(i, 1);
	  }
	}
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