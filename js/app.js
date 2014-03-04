var app = angular.module('appMonkey', ['AppList']);

app.config(['$compileProvider', function ($compileProvider) {
  //replace img src regex with one that allow chrome:// at the beginning to use the internal img urls
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|chrome):|data:image\//);
}]);

//declare directive for own pseudo element <am-keybind on="" invoke=""></>
app.directive('amKeybind', function () {
  return {
    restrict: 'E',
    scope: { invoke: '&' },
    link: function (scope, el, attr) {
      Mousetrap.bind(attr.on, scope.invoke);
    }
  };
});