/*global $, Utils, tau*/

function pageScroll(e) {

	try {
		var content = $("#linkWindow").parent();
		if (e.detail.direction === "CW") {
			content.scrollTop(content.scrollTop() + 50);
		} else if (e.detail.direction === "CCW") {
			content.scrollTop(content.scrollTop() - 50);
		}
	} catch (ex) {
		alert(ex);
	}
}

window.onload = function() {

	var link = localStorage.getItem("link");
	if (link){
		tau.changePage("linkWindow");
	}
	localStorage.setItem("link", null);
	
	$("#linkWindow iframe").one("load", function(){
		$("#linkWindow progress").hide();
	});
	$("#linkWindow progress").show();
	$("#linkWindow iframe").prop("src", link);
	
	
	document.addEventListener("rotarydetent", pageScroll);	
	document.addEventListener('tizenhwkey', function(e) {
		if (e.keyName === "back" && Utils.getActivePage() !== "linkWindow") {
			window.open("index.html");
		}
	});
};
