angular.module('myApp.user').config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/signup', {
    templateUrl: 'partials/signup.html',
    controller: 'User'
  })
  .when('/login', {
    templateUrl: 'partials/login.html',
    controller: 'User'
  })
  .otherwise({
    redirectTo: '/login'
  });
}]);

angular.module('myApp.user').controller('User', ['$scope', '$http', '$location', '$userState', function($scope, $http, $location, $userState) {
  $scope.formData = {};
    
  // when submitting the add form, send the text to the node API
  $scope.createUser = function() {
    $http.post('/signup', $scope.formData)
      .success(function(data) {
        $scope.formData = {}; // clear the form so our user is ready to enter another
        $location.path( 'home' );
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  };
  
  // when submitting the add form, send the text to the node API
  $scope.loginUser = function() {
    $http.post('/login', $scope.formData)
      .success(function(data) {
        $scope.formData = {}; // clear the form so our user is ready to enter another
        
        /* post login process */
        $userState.setData(data['user']);
        $userState.invoke(function(err){
          $location.path( 'home' );
          });
        
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  };
  
  $scope.redirect = function ( path ) {
    $location.path( path );
  };
}]);

angular.module('myApp.user').service("$userState", ['$http', '$location', function($http, $location){
  var isLoggedin = false;
  var data = {};

  return {
  findUser: function(next) {
    var self = this;
    if (isLoggedin === true) {
      self.invoke(next);
      return;
    }
    // when landing on the page, get data and show them
    $http.get('/home')
    .success(function(result) {
      data = result['user'];
      
      /* check response object, redirect if invalid user */
      if (typeof data['_id'] == 'undefined') {
        $location.path( 'login' );
        return;
      }
      
      /* post login process */
      self.invoke(next);
    })
    .error(function(data) {
      console.log('Error: ' + data);
      $location.path( 'login' );
    });
  },
  
  invoke: function(next) {
    if (isLoggedin !== true) {
      isLoggedin = true;
      socket.connect(data);
    }
    
    if (isCallable(next) !== true) {
      return;
    }
    
    next(null, function(err, next2){
      if (err) {
        return;
      }
      if (isCallable(next2)) {
        next2();
      }
      });    
  },
  
  login: function(uname, passwd) {
    console.log([uname, passwd]);
    isLoggedin = true;
    data['uname'] = uname;
  },
  
  logout: function() {
    isLoggedin = false;
    data = {};
  },
  
  signup: function(uname, passwd, firstName, lastName) {
    isLoggedin = true;
    data['uname'] = uname;
  },
  
  setData: function(object) {
    data = object;
    },
    
  getData: function() {
    data['isLoggedin'] = isLoggedin;
    return data;
  }
  
  };
  
}]);