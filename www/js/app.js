var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

var cameraApp = angular
  .module('AngularApp', ['ngRoute'])
  .service('Config', function() {
    this.host = '';
  })
  .controller('MainController', ['$scope', '$http', 'Config', function($scope, $http, Config) {
    $scope.activate = function() {
      $http.post(Config.host + '/activate');
    };
  }])
  .controller('SettingsController', ['$scope', 'Config', function($scope, Config) {
    $scope.config = {};
    $scope.load = function() {
      $scope.config = $.extend({}, Config);
    };
    $scope.update = function() {
      $.extend(Config, $scope.config);
    }
  }]);

