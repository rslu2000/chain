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




// Modal to sign up for newsletter
$(function () {
  var modal = document.getElementById('downloadModal');

// Get the button that opens the modal
  var btn = document.getElementById("downloadBtn");

// Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
  btn.onclick = function () {
    modal.style.display = "block";
  }

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
})



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
