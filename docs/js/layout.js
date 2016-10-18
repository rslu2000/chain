"use strict";

// keep active class on the sidebar nav items
$(function () {
  if (location.pathname == '/') {
    $('.docs-nav a[href$="' + ('/install') + '"]').addClass('active');
  } else {
    var p = location.pathname;
    $('.docs-nav a[href$="' + (p) + '"]').addClass('active');
  }
});


// switcher between the navtabs for operating systems
function openOS(evt, osName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the link that opened the tab
  document.getElementById(osName).style.display = "block";
  evt.currentTarget.className += " active";
}


// Download file based on OS
// TODO: UPDATE
$("#macRequest").click(function() {
  window.location = 'mac.doc';
});

$("#windowsRequest").click(function() {
  window.location = 'windows.doc';
});

$("#linuxRequest").click(function() {
  window.location = 'linux.doc';
});


// Find all content between h2 and wrap it with section tag
$('#doc-content h2').each(function(){
  $(this).nextUntil('h2').andSelf().wrapAll('<section />');
  $(this).nextAll().wrapAll()
    .end().wrap();
});



// Modal to sign up for newsletter
function showSignUpForm() {
  var modal = document.getElementById('downloadModal');

// Get the button that opens the modal
  var btn = document.getElementById("downloadBtn");

// Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
  modal.style.display = "block";

// When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
  }

// When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}
$(function () {
  $("#downloadBtn1").click(function() {
    showSignUpForm();
    return true;
  });
})




// This finds <p> <aside> pairs and wraps them in <section class="text-block">.
// Inner paragraphs are wrapped together in <div class="text-main">
function rewrapSidenotes() {
	var collectedElements = {
		state: "idle",
		paragraphs: [],
		sidenote: null
	}
	$("#content.sidenotes-able > *").each(function(index){
		var element = $(this)
		var tag = element[0].nodeName.toLowerCase()
		
		console.log("tag: " + element[0].nodeName.toLowerCase())
		
		if (collectedElements.state == "idle") {
			if (tag != "aside") {
				// We need to find the first element before the sidenote.
				// So we remember one element only, right before the sidenote.
				collectedElements.paragraphs = [ element ]
			} else {
				// If this is an sidenote, start collecting paragraphs
				collectedElements.sidenote = element
				collectedElements.state = "collecting"
				
				console.log("Begin collecting")
			}
		} else if (collectedElements.state == "collecting") {
			if (tag != "aside") {
				// Lets remember all elements until we find the sidenote.
				// If/when we find the sidenote, we'll pop that element.
				console.log("collecting: adding an element: " + tag)
				collectedElements.paragraphs.push(element)
			} else {
				// Oops, some other sidenote is detected - let's forget the last added paragraph - it belongs to that sidenote's group.
				var lastparagraph = collectedElements.paragraphs.pop()
				var nextsidenote = element
				
				// 1. Wrap collected elements.
				// 1.1. Insert sidenote after the last paragraph.
				console.log("1.1. Insert after the last paragraph")
				collectedElements.sidenote.insertAfter(collectedElements.paragraphs[collectedElements.paragraphs.length - 1])
				
				// 1.2. Wrap all paragraphs.
				console.log("1.2. Wrap all paragraphs")
				$.each(collectedElements.paragraphs, function(index, value) {
					value.addClass("temp-wrapping-class")
				});
				
				$(".temp-wrapping-class").wrapAll("<div class=\"text-main temp-superwrapping-class\"></div>")
				
				$.each(collectedElements.paragraphs, function(index, value) {
					value.removeClass("temp-wrapping-class")
				});
				
				// 1.3. Wrap paragraph's wrapper and sidenote in a section wrapper.
				console.log("1.3. Wrap super wrappers")
				collectedElements.sidenote.addClass("temp-superwrapping-class")
				$(".temp-superwrapping-class").wrapAll("<section class=\"text-block\"></section>")
				$(".temp-superwrapping-class").removeClass("temp-superwrapping-class")
				
				// 2. Put lastparagraph and nextsidenote into a new collectedElements group
				collectedElements.state = "collecting"
				collectedElements.paragraphs = [lastparagraph]
				collectedElements.sidenote = nextsidenote
			}
		} else {
			console.error("Unsupported state. Should never happen." + collectedElements.state)
		}
	})
	
	// wrap remaining items if in "collecting" state
	
	// 1. Wrap collected elements.
	// 1.1. Insert sidenote after the last paragraph.
	console.log("1.1. Insert after the last paragraph")
	collectedElements.sidenote.insertAfter(collectedElements.paragraphs[collectedElements.paragraphs.length - 1])
	
	// 1.2. Wrap all paragraphs.
	console.log("1.2. Wrap all paragraphs")
	$.each(collectedElements.paragraphs, function(index, value) {
		value.addClass("temp-wrapping-class")
	});
	
	$(".temp-wrapping-class").wrapAll("<div class=\"text-main temp-superwrapping-class\"></div>")
	
	$.each(collectedElements.paragraphs, function(index, value) {
		value.removeClass("temp-wrapping-class")
	});
	
	// 1.3. Wrap paragraph's wrapper and sidenote in a section wrapper.
	console.log("1.3. Wrap super wrappers")
	collectedElements.sidenote.addClass("temp-superwrapping-class")
	$(".temp-superwrapping-class").wrapAll("<section class=\"text-block\"></section>")
	$(".temp-superwrapping-class").removeClass("temp-superwrapping-class")
	
}

$(function(){
	rewrapSidenotes()
})




/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2006, 2014 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD (Register as an anonymous module)
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (arguments.length > 1 && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setMilliseconds(t.getMilliseconds() + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {},
		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
			cookies = document.cookie ? document.cookie.split('; ') : [],
			i = 0,
			l = cookies.length;

		for (; i < l; i++) {
			var parts = cookies[i].split('='),
				name = decode(parts.shift()),
				cookie = parts.join('=');

			if (key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));