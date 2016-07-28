/*jslint
  indent:2
*/
/*global $, jQuery */
(function() {
  'use strict';
  var s,
    render,
    template,
    getExercises,
    getReadmeForExercise,
    extractLevel,
    transformExercise,
    sortByLevel,
    renderReadmeList,
    whenAll,
    fetchReadmes,
    buildNavigation;
    
  
  // Micro templating
  render = function(string, data) {
    for(s in data) {
      string = string.replace(new RegExp('{'+s+'}', 'g'), data[s]);
    }
    return string;
  };
  
  // Create a template function bound to a
  // template string ready for rendering data
  // Usage: var tmpl = template('Hi {name}')
  //        var rendered = tmpl({name: 'Johan'})
  //        => 'Hi Johan'
  template = function(string) {
    'use strict';
    return render.bind(this, string);
  };
  
  getExercises = function() {
    'use strict';
    return $.getJSON('exercises.json').then(function(res) {
      return res;
    });
  };
  
  getReadmeForExercise = function(exercise) {
    'use strict';
    return $.get('exercises/' + exercise.name + '/README.html');
  };
  
  // Matches:
  //   Svårighetsgrad: <level>
  //   **Svårighetsgrad: **<level>
  //   Svårighetsgrad <level>
  //   etc.
  extractLevel = function(content) {
    'use strict';
    var matches = content.match(/Svårighetsgrad[\D]*(\d)/i);
    return matches ? matches[1] : false;
  };
  
  // Create a plain object for templating
  transformExercise = function(exercise, i) {
    'use strinct';
    var content = exercise.readme;
    var files = exercise.files;
    var name = $(content).filter("h1").first().text();
  
    // Include listing of attached files if there are any
    if (files.length > 0) {
  
      var items = [];
      files.forEach(function(file) {
        items.push('<a href="exercises/' + exercise.name + '/' + file + '" download>' + file + '</a>');
      });
  
      var filesText = '\n<h2>Filer</h2>\n' + items.join(", ");
  
      // Inject list of files before first h2, or at the end if there are none
      var $html = $('<div />', { html: content }),
          h2s = $html.find('h2');
          
      if (h2s.length > 0) {
        h2s.first().before(filesText);
      } else {
        $html.append(filesText);
      }
      content = $html.html();
    }
  
    return {
      order: i,
      level: extractLevel(content) || 'Okänd',
      text: name, // The first heading
      content: content
    };
  };
  
  // Comparator function for exercises
  sortByLevel = function(exercises) {
    'use strict';
    return exercises.sort(function(e1, e2) {
      return (e1.level > e2.level) ? 1 :
        (e1.level < e2.level) ? -1 : 0;
    });
  };
  
  // Build the list from an exercises object array
  renderReadmeList = function(exercises) {
    'use strict';
    var $container = $(".exercises-list"),
        tmpl = template($("#exercise-template").html());
  
    // Render each exercise with 'tmpl', whose only argument
    // is a data object (given in Array.map).
    return $container.html( exercises.map(tmpl).join("") );
  };
  
  // Custom function mimicing Q.all():
  // returns a promise whose argument is
  // an array with all data objects. Takes
  // and array of promises
  whenAll = function(promises) {
    'use strict';
    var slice = Array.prototype.slice;
    return $.when.apply($, promises).then(function() {
      return slice.call(arguments).map(function(r) {
        // The first element is the data object
        // The others are the status and the XHR promise itself.
        return r[0];
      });
    });
  };
  
  // Fetch READMEs and build list
  fetchReadmes = function() {
    'use strict';
  
    // Fetch exercises
    getExercises()
  
      // Then for each exercise, fetch its README
      .then(function(exercises) {
  
        // Add readme to each exercise
        // Could probably be done more elegantly
  
        var dfd = $.Deferred();
        // Modify exercise object when all README-fetches have settled
        whenAll(exercises.map(getReadmeForExercise)).then(function(readmes) {
          readmes.forEach(function(readme, i) {
            exercises[i].readme = readme;
          });
          dfd.resolve(exercises);
        });
        return dfd;
      })
      
      // Transform each exercise (parse out relevant data for templating)
      .then(function(exercises) {
        return exercises.map(transformExercise);
      })
  
      // Sort by difficulty level
      .then(sortByLevel)
  
      // Render the exercises with README content
      .then(renderReadmeList);
  };
  
  buildNavigation = (function($) {
    'use strict';
  
    var defaults = {
      container: "body",
      nodes: "h1",
      navigation: "[role='navigation'] ul"
    };
  
    return function(options) {
      options = $.extend({}, defaults, options);
  
      var headings = $(options.container).find(options.nodes),
          frag = [];
  
      headings.each(function(i, item) {
        if(!item.id) return;
  
        var li = $("<li />"),
  
        a = $("<a />", {
          href: "#"+item.id,
          text: $(item).text(),
          "data-scroll": true
        });
  
        li.append(a);
        frag.push(li);
      });
  
      $(options.navigation).html(frag);
    };
  
  })(jQuery);
  
  $(function() {
    'use strict';
  
    fetchReadmes();
  
    buildNavigation({
      container: "[role='main']"
    });
  
    $("#accordion").on("shown.bs.collapse", function(evt) {
      var panel = $(evt.target);
    });
  
  });

})();