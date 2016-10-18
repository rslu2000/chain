"use strict";

function activateCurrentSidebarItem() {
	if (location.pathname == '/') {
	  $('.docs-nav a[href$="' + ('/install') + '"]').addClass('active');
	} else {
	  var p = location.pathname;
	  $('.docs-nav a[href$="' + (p) + '"]').addClass('active');
	}		
}

function prepareSidebarMenu() {
	activateCurrentSidebarItem()
	
    $(".toggle").click(function(e) {
      e.preventDefault();
  
      var $this = $(this);
  
      if ($this.next().hasClass('show')) {
        $this.next().removeClass('show');
        $this.next().slideUp(350);
      } else {
        $this.parent().parent().find('li .inner').removeClass('show');
        $this.parent().parent().find('li .inner').slideUp(350);
        $this.next().toggleClass('show');
        $this.next().slideToggle(350);
      }
    }).first().click();
}

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

function attachSignupFormToDownloadButton() {
	$(".downloadBtn").click(function() {
	  	showSignUpForm();
	  	return true;
	});
}

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


// This finds <p> <div class="sidenote"> pairs and wraps them in <section class="text-block">.
// Inner paragraphs are wrapped together in <div class="text-main">.
// The result is:
/*
	<p> 
	<p>
	...
	<section class="text-block">
		<div class="text-main">
			<p>
			<p>
			...
		</div>
		<div class="sidenote">
			<p>
			<p>
			...
		</div>
	</section>
	...
	<p>

*/

function rewrapSidenotes() {
	var collectedElements = {
		state: "idle",
		paragraphs: [],
		sidenote: null
	}
	$(".sidenotes-container > *").each(function(index){
		var element = $(this)
		var klass = element.attr('class')
		var tag = element[0].nodeName.toLowerCase()
		
		console.log("tag: " + element[0].nodeName.toLowerCase())
		
		if (collectedElements.state == "idle") {
			if (klass != "sidenote") {
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
			if (klass != "sidenote") {
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
	if (collectedElements.state == "collecting") {
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
}



