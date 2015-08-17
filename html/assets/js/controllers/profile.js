angular.module('myApp.profile').config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/editprofile', {
    templateUrl: 'partials/editprofile.html',
    controller: 'Profile'
  })
  .when('/password', {
    templateUrl: 'partials/password.html',
    controller: 'Profile'
  })
  .when('/picture', {
    templateUrl: 'partials/picture.html',
    controller: 'Profile'
  })
  .when('/home', {
    templateUrl: 'partials/sidebar.html',
    controller: 'Profile',
    /*redirectTo: '/search/history'*/
  })
}]);

angular.module('myApp.profile').controller('Profile', ['$scope', '$http', '$routeParams', '$location', '$userState', function($scope, $http, $routeParams, $location, $userState) {
  $scope.tplSidebar = 'partials/sidebar.html';
	  
  $userState.findUser(function(err, next){
    if (err) {
      return;
    }
    $scope.user = $userState.getData();
    console.log('$userState.findUser', $scope.user);
    next();
    });
  
  $scope.updateUser = function() {
    $http.put('/users/' + $scope.user['uname'] + '', $scope.user)
      .success(function(data) {
        console.log(data);
        $location.path( 'home' );
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  }
  
  $scope.updatePassword = function() {
    $http.put('/users/' + $scope.user['uname'] + '/password', $scope.user)
      .success(function(data) {
        console.log(data);
        $location.path( 'home' );
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  }
  
  $scope.uploadFile = function(uname) {
    var fd = new FormData();
    fd.append('file', $scope.user['picture']);
    $http.put('/users/' + $scope.user['uname'] + '/picture', fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
    })
    .success(function(){
      $location.path( 'home' );
    })
    .error(function(){
      console.log('Error: ' + data);
    });
  }
  
  $scope.logout = function() {
    $http.get('/signout')
      .success(function(data) {
        console.log(data);
        $location.path( 'login' );
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  }
  
  $scope.redirect = function ( path ) {
    $location.path( path );
  };	
}]);