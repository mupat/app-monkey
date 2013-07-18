var apps = [
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
]
var PAGE_UP = 38
var PAGE_DOWN = 40
var ENTER = 13

launchApp = function(id) {
  if(/custom$/.test(id)) {
    for (var i = 0; i <= apps.length - 1; i++) {
      if(apps[i].id === id) {
        chrome.tabs.create({ url: apps[i].url });
        window.close();
        break;
      }
    };
  } else {
    chrome.management.launchApp(id, function() { window.close(); });
  }
}

compareByName = function(app1, app2) {
  var a = app1.name.toLowerCase();
  var b = app2.name.toLowerCase();
  return (a > b) ? 1 : (a == b) ? 0 : -1;
}

buildElementHTML = function(app) {
  html = "<li id='" + app.id + "' class='hidden icon-enter'>";

  if(!app.isApp) {
    html += "<span class='icon-link'></span>"
  } else {
    html += "<img src='" + app.icons[app.icons.length - 1].url + "' alt='icon for " + app.name + "' />";
  }
  
  html += "<p>" + app.name + "</p></li>";

  return html;
}

buildListHTML = function(elementHTML) {
  return "<ul>" + elementHTML + "</ul>";
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.management.getAll(function(allApps) {
    var html = "";
    for (var i = 0; i <= allApps.length - 1; i++) { if(allApps[i].isApp) { apps.push(allApps[i]); }};
    
    apps.sort(compareByName);
    for (var i = 0; i <= apps.length - 1; i++) { html += buildElementHTML(apps[i]); };

    $("#applist").html(buildListHTML(html));
    $("#search").removeAttr("disabled");

    $("#search").on('keyup', function(e) {
      if(e.keyCode === PAGE_UP || e.keyCode === PAGE_DOWN || e.keyCode === ENTER) return;

      var visibleCount = 0;
      var text = $.trim($(this).val()).toLowerCase();
      for (var i = 0; i <= apps.length - 1; i++) {
        var index = apps[i].name.toLowerCase().indexOf(text);
        var $app = $("#" + apps[i].id);
        if(text.length === 0 || index === -1) {
          $app.addClass('hidden').removeClass('visible').hide();
        } else {
          $app.addClass('visible').removeClass('hidden').show();
          visibleCount++;
        }
      };

      console.log('count', visibleCount);
      if(visibleCount === 0) $('#hint').show() 
      else $('#hint').hide()

      $('.active').removeClass('active');
      $('.visible').first().addClass('active');
    });

    $('#applist').on('click', '.visible', function(e) {
      launchApp($(this).attr('id'));
    });

    $('#applist').on('mouseenter', '.visible', function(e) {
      self = $(this);
      if(!self.hasClass('active')) {
        self.parent().find('.active').removeClass('active');
        self.addClass('active');
      }
    });

    $('body').on('keyup', function(e) {
      if(e.keyCode === ENTER) launchApp($('.active').attr('id'));

      if(e.keyCode === PAGE_UP || e.keyCode === PAGE_DOWN) {
        visibles = $('.visible')
        visibles.each(function(index, item) {
          item = $(item);
          if(item.hasClass('active')) {
            item.removeClass('active');

            var i = (e.keyCode === PAGE_UP) ? 
              (index > 0) ? index - 1 : visibles.length - 1 : 
              (index < visibles.length - 1) ? index + 1 : 0;

            visibles.eq(i).addClass('active'); 
            return false;
          }
        });
      }

      return false;
    });
  });
});
