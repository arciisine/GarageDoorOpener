var garageDoorApp = angular
  .module('GarageDoorApp', ['ng','ngRoute'])
  .service('Config', function() {
    var data = localStorage.getItem('Config');

    this.host = '';

    if (data) {
      $.extend(this, JSON.parse(data));
    }

    this.ready = function() {
      return this.host !== '';
    };
  })
  .config(['$routeProvider', function($routeProvider){
    $routeProvider
      .when('/settings', { templateUrl : 'settings.html' })
      .otherwise({ templateUrl : 'main.html' })
  }])
  .controller('MainController', ['$scope', '$http', 'Config', '$location', function($scope, $http, Config, $location) {
    $scope.Config = Config;
    if (!Config.ready()) {
      $location.path('/settings');
    }
    $scope.activate = function() {
      $http.post(Config.host + '/activate');
    };
  }])
  .controller('SettingsController', ['$scope', 'Config', '$location', function($scope, Config, $location) {
    $scope.Config = Config;
    $scope.update = function() {
      localStorage.setItem('Config', JSON.stringify(Config));
      $location.path('/');
    }
  }])
  .directive('arrange', function() {
    return {
      restrict : 'A',
      link : function(scope, elem, attrs) {
        var items = elem.children();
        var fixed = items.filter('.fixed');
        var dynamic = items.filter(':not(.fixed)');
        var count = $(elem).height();
        fixed.each(function() {
          var item = $(this);
          count -= (parseInt(item.height())
            + parseInt(item.css('margin-top'))
            + parseInt(item.css('margin-bottom'))
            + parseInt(item.css('border-top'))
            + parseInt(item.css('border-bottom')));
        });

        dynamic.each(function() {
          var item = $(this);
          item.height(count/dynamic.length);
        });
      }
    };
  });

var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  onDeviceReady: function() {
    app.receivedEvent('deviceready');
    document.addEventListener("menubutton", function(e){
      window.location = '#/settings';
    }, false);
  },
  receivedEvent: function(id) {
    console.log('Received Event: ' + id);
  }
};