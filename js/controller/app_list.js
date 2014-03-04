var AppListCtrl = (function () {
  var _DEFAULT_APPS = [
    {
      id: 'extensions_page_custom',
      name: 'Extensions page',
      url: 'chrome://extensions/',
      isApp: false
    },
    {
      id: 'settings_page_custom',
      name: 'Settings page',
      url: 'chrome://settings/',
      isApp: false
    },
    {
      id: 'history_page_custom',
      name: 'History page',
      url: 'chrome://history/',
      isApp: false
    }
  ];
  var _SCROLL_STEP = 47;
  var _MAX_VIEWPORT_SIZE = _SCROLL_STEP * 4;

  //constructor
  function AppListCtrl($scope) {
    $scope.changeSearchInput = this.changeSearchInput.bind(this);
    $scope.clickApp = this.clickApp.bind(this);
    $scope.enterApp = this.enterApp.bind(this);
    $scope.nextApp = this.nextApp.bind(this);
    $scope.previousApp = this.previousApp.bind(this);
    $scope.keyDownSearchInput = this.keyDownSearchInput.bind(this);
    $scope.hoverApp = this.hoverApp.bind(this);

    this._$elAppList = document.getElementById("applist");
    this._$scope = $scope;
    this.loadApps();
  }

  AppListCtrl.prototype.loadApps = function () {
    var i = 0;
    var app = {};
    var self = this;

    this._$scope.apps = _DEFAULT_APPS; //add default apps
    chrome.management.getAll(function (allApps) {
      for (i = 0; i <= allApps.length - 1; i++) {
        if (allApps[i].isApp) { //only add real apps
          app = allApps[i];
          app.imgUrl = app.icons[app.icons.length - 1].url; // get biggest img to have best resolution
          self._$scope.apps.push(app);
        }
      }
    });

    self._$scope.apps.sort(this._compareByName); //sort array by name
  };

  AppListCtrl.prototype.changeSearchInput = function () {
    var visible = this._$scope.search.name.length > 0 ? true : false; //check if applist should be visible
    var filteredApps = this._$scope.filteredApps;

    //if applist should be visible and is not empty
    if (visible && filteredApps.length > 0) {
      this._removeActiveApp();
      this._$scope.filteredApps[0].isActive = true; //set first one active
    }

    //apply visible stat to view
    this._$scope.listVisible = visible;
  };

  AppListCtrl.prototype.hoverApp = function (app) {
    this._removeActiveApp();
    app.isActive = true;
  }

  AppListCtrl.prototype.enterApp = function () {
    var activeApp = this._getActiveApp().app; //get active app
    this._openApp(activeApp); //open active app
  };

  AppListCtrl.prototype.clickApp = function (app) {
    this._openApp(app); //open app, that occured the click
  };

  AppListCtrl.prototype.nextApp = function () {
    var activeObj = this._getActiveApp();
    var filteredApps = this._$scope.filteredApps;
    var nextApp = {};
    var currentPosTop = futurePosTop = 0;

    //determine next active app
    if (activeObj.index + 1 === filteredApps.length) { // if last app, set first
      nextApp = filteredApps[0];

      //reset scroll position to null
      this._$elAppList.scrollTop = 0;      
    } else { // if not last one, take the next
      nextApp = filteredApps[activeObj.index + 1];

      //determine if we need to scroll
      currentPosTop = this._$elAppList.scrollTop;
      futurePosTop = (activeObj.index + 1) * _SCROLL_STEP;
      // if future position is outside the bottom of the viewport
      if (futurePosTop - currentPosTop >= _MAX_VIEWPORT_SIZE) { 
        this._$elAppList.scrollTop += _SCROLL_STEP;  
      }
    }

    // run explicit in apply function, to make sure it gets applied to the view
    this._$scope.$apply(function () {
      activeObj.app.isActive = false; //reset active app
      nextApp.isActive = true; //set next app active
    });
  };

  AppListCtrl.prototype.previousApp = function () {
    var activeObj = this._getActiveApp();
    var filteredApps = this._$scope.filteredApps;
    var previousApp = {};
    var posTop = currentPostTop = futurePosTop = 0;

    //determine previous app
    if (activeObj.index === 0) { // if first app, set last
      previousApp = filteredApps[filteredApps.length - 1];

      //scroll to the end if the list
      posTop = (filteredApps.length - 4) * _SCROLL_STEP;
      if (posTop < 0) { posTop = 0; } 
      this._$elAppList.scrollTop = posTop;      
    } else { // if not set previous
      previousApp = filteredApps[activeObj.index - 1];

      //determine if we need to scroll
      currentPosTop = this._$elAppList.scrollTop;
      futurePosTop = (activeObj.index - 1) * _SCROLL_STEP;
      // if future position is outside of the top of the viewport
      if (currentPosTop - futurePosTop > 0) {
        this._$elAppList.scrollTop -= _SCROLL_STEP;
      }
    }

    // run explicit in apply function, to make sure it gets applied to the view
    this._$scope.$apply(function () {
      activeObj.app.isActive = false; //reset active app
      previousApp.isActive = true; //set previous app active
    });
  };

  AppListCtrl.prototype.keyDownSearchInput = function ($event) {
    var up = 38;
    var down = 40;
    //prevent default behaviour for search input field, when hitting 'up' or 'down' key
    if ($event.which === up || $event.which === down) {
      $event.preventDefault();
    }
  };

  AppListCtrl.prototype._removeActiveApp = function () {
    var i = 0;
    var filteredApps = this._$scope.filteredApps;

    //reset all active apps
    for (i = 0; i < filteredApps.length; i++) { 
      filteredApps[i].isActive = false; 
    } 
  };

  AppListCtrl.prototype._openApp = function (app) {
    if (app.isApp) { //if app then launch via management api
      chrome.management.launchApp(app.id, function () { window.close(); });
    } else { //otherwise open url in new tab
      chrome.tabs.create({ url: app.url });
      window.close();
    }
  };

  AppListCtrl.prototype._getActiveApp = function () {
    var i = 0;
    var filteredApps = this._$scope.filteredApps;
    var activeApp = {};

    for (i = 0; i < filteredApps.length; i++) {
      if (filteredApps[i].isActive) {
        activeApp = filteredApps[i];
        break;
      }
    }

    return {app: activeApp, index: i};
  };

  AppListCtrl.prototype._compareByName = function (app1, app2) {
    var a = app1.name.toLowerCase();
    var b = app2.name.toLowerCase();
    return (a > b) ? 1 : (a === b) ? 0 : -1;
  };

  return AppListCtrl;
})();

//introduce class to angular world
angular.module('AppList', [])
       .controller('AppListCtrl', ['$scope', function ($scope) { new AppListCtrl($scope); }]);